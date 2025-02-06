import { boolean, text } from 'drizzle-orm/pg-core';
import { Struct, StructStream } from 'drizzle-struct/back-end';
import { attemptAsync, resolveAll } from 'ts-utils/check';
import { Account } from './account';
import { DB } from '../db';
import { and, eq, sql } from 'drizzle-orm';
import { Permissions } from './permissions';
import { Session } from './session';
import { z } from 'zod';
import { createEntitlement, readEntitlement } from '../utils/entitlements';

export namespace Universes {
	export const Universe = new Struct({
		name: 'universe',
		structure: {
			name: text('name').notNull(),
			description: text('description').notNull(),
			public: boolean('public').notNull()
		}
	});

	Universe.on('delete', (u) => {
		Struct.each((s) => {
			s.each((d) => {
				d.setUniverse('');
			});

			UniverseInvite.fromProperty('universe', u.id, {
				type: 'stream'
			}).pipe((i) => i.delete());
		});
	});

	export type UniverseData = typeof Universe.sample;

	export const getUniverses = async (accountId: string) => {
		return attemptAsync(async () => {
			// return resolveAll(
			// 	await Promise.all(
			// 		account
			// 			.getUniverses()
			// 			.unwrap()
			// 			.map((u) => Universes.Universe.fromId(u))
			// 	)
			// )
			// 	.unwrap()
			// 	.filter(Boolean) as Universes.UniverseData[];

			const data = await DB.select()
				.from(Universe.table)
				.innerJoin(
					Permissions.RoleAccount.table,
					eq(Permissions.RoleAccount.table.account, accountId)
				)
				.innerJoin(
					Permissions.Role.table,
					eq(Permissions.RoleAccount.table.role, Permissions.Role.table.id)
				)
				.where(eq(Permissions.Role.table.name, 'Member'));

			return data.map((d) => Universe.Generator(d.universe));
		});
	};

	export const UniverseInvite = new Struct({
		name: 'universe_invite',
		structure: {
			universeId: text('universe_id').notNull(),
			account: text('account').notNull(),
			inviter: text('inviter').notNull()
		}
	});

	UniverseInvite.callListen('invite', async (event, data) => {
		const session = (await Session.getSession(event)).unwrap();
		const account = (await Session.getAccount(session)).unwrap();

		if (!account) {
			throw new Error('Not logged in');
		}

		const i = z
			.object({
				user: z.string(),
				universe: z.string()
			})
			.parse(data);

		const invitee = (await Account.Account.fromId(i.user)).unwrap();
		if (!invitee) throw new Error('Account not found');

		const u = (await Universe.fromId(i.universe)).unwrap();
		if (!u) throw new Error('Universe not found');

		await invite(u, invitee, account);

		return {
			success: true
		};
	});

	export type UniverseInviteData = typeof UniverseInvite.sample;

	export const createUniverse = async (
		config: {
			name: string;
			description: string;
			public: boolean;
		},
		account: Account.AccountData
	) => {
		return attemptAsync(async () => {
			const u = (await Universe.new(config)).unwrap();
			const admin = (
				await Permissions.Role.new({
					universe: u.id,
					name: 'Admin',
					description: `${u.data.name} Aministrator`,
					links: '[]',
					entitlements: '[]'
				})
			).unwrap();
			const member = (
				await Permissions.Role.new({
					universe: u.id,
					name: 'Member',
					description: `${u.data.name} Member`,
					links: '[]',
					entitlements: '[]'
				})
			).unwrap();
			(
				await admin.update({
					entitlements: JSON.stringify(['manage-roles', 'manage-universe'])
				})
			).unwrap();
			(await admin.setUniverse(u.id)).unwrap();
			(await admin.setStatic(true)).unwrap();
			await Permissions.RoleAccount.new({
				role: admin.id,
				account: account.id
			});
			(
				await Permissions.RoleAccount.new({
					role: member.id,
					account: account.id
				})
			).unwrap();
			(
				await member.update({
					entitlements: JSON.stringify(['view-roles', 'view-universe'])
				})
			).unwrap();
			(await member.setUniverse(u.id)).unwrap();
			(await member.setStatic(true)).unwrap();

			return u;
		});
	};

	export const invite = async (
		universe: Universes.UniverseData,
		account: Account.AccountData,
		inviter: Account.AccountData
	) => {
		return attemptAsync(async () => {
			const invite = (
				await UniverseInvite.new({
					universeId: universe.id,
					account: account.id,
					inviter: inviter.id
				})
			).unwrap();

			(
				await Account.sendAccountNotif(account.id, {
					title: 'Universe Invite',
					message: `You have been invited to join ${universe.data.name} by ${inviter.data.username}`,
					severity: 'info',
					icon: '/assets/icons/invite.svg',
					link: `/universe/invite/${invite.id}`
				})
			).unwrap();

			return invite;
		});
	};

	export const getInvites = async (
		account: Account.AccountData,
		config: {
			type: 'array';
			limit: number;
			offset: number;
		}
	) => {
		return attemptAsync(async () => {
			const res = await DB.select()
				.from(UniverseInvite.table)
				.innerJoin(Universe.table, eq(UniverseInvite.table.universe, Universe.table.id))
				.limit(config.limit)
				.offset(config.offset)
				.where(sql`${UniverseInvite.table.account} = ${account.id}`);

			return res.map((r) => ({
				invite: UniverseInvite.Generator(r.universe_invite),
				universe: Universe.Generator(r.universe)
			}));
		});
	};

	export const acceptInvite = async (invite: UniverseInviteData) => {
		return attemptAsync(async () => {
			const { account, universe } = invite.data;

			const a = await (await Account.Account.fromId(account)).unwrap();
			if (!a) return;

			const roles = (
				await Permissions.Role.fromProperty('universe', universe, {
					type: 'stream'
				}).await()
			).unwrap();

			const member = roles.find((r) => r.data.name === 'Member'); // should always succeed because data is static

			if (!member) throw new Error('Member role not found');

			(
				await Permissions.RoleAccount.new({
					account: a.id,
					role: member.id
				})
			).unwrap();

			(await invite.delete()).unwrap();
		});
	};

	export const declineInvite = async (invite: UniverseInviteData) => {
		return invite.delete();
	};

	export const isMember = async (
		account: Account.AccountData,
		universe: Universes.UniverseData
	) => {
		return attemptAsync(async () => {});
	};

	export const getMembers = async (universe: UniverseData) => {
		return attemptAsync(async () => {
			const data = await DB.select()
				.from(Account.Account.table)
				.innerJoin(
					Permissions.RoleAccount.table,
					eq(Account.Account.table.id, Permissions.RoleAccount.table.account)
				)
				.innerJoin(
					Permissions.Role.table,
					eq(Permissions.RoleAccount.table.role, Permissions.Role.table.id)
				)
				.where(eq(Permissions.Role.table.universe, universe.id));
			return data
				.filter((v, i, a) => a.findIndex((t) => t.account.id === v.account.id) === i)
				.map((d) => Account.Account.Generator(d.account));
		});
	};

	export const memberRoles = async (account: Account.AccountData, universe: UniverseData) => {
		return attemptAsync(async () => {
			const data = await DB.select()
				.from(Permissions.RoleAccount.table)
				.innerJoin(
					Permissions.Role.table,
					eq(Permissions.RoleAccount.table.role, Permissions.Role.table.id)
				)
				.where(
					and(
						eq(Permissions.RoleAccount.table.account, account.id),
						eq(Permissions.Role.table.universe, universe.id)
					)
				);

			return data.map((d) => Permissions.Role.Generator(d.role));
		});
	};

	createEntitlement({
		name: 'manage-universe',
		structs: [Universe],
		permissions: ['*'],
		group: 'Universe'
	});

	createEntitlement({
		name: 'view-universe',
		structs: [Universe],
		// permissions: ['read:name', 'read:description', 'read:public']
		permissions: ['universe:read:name', 'universe:read:description'],
		group: 'Universe'
	});
}

export const _universeTable = Universes.Universe.table;
export const _universeInviteTable = Universes.UniverseInvite.table;

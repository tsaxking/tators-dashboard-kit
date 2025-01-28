import { boolean, text } from 'drizzle-orm/pg-core';
import { Struct, StructStream } from 'drizzle-struct/back-end';
import { attemptAsync, resolveAll } from 'ts-utils/check';
import { Account } from './account';
import { DB } from '../db';
import { eq, sql } from 'drizzle-orm';
import { Permissions } from './permissions';
import { Session } from './session';
import { z } from 'zod';

export namespace Universes {
	export const Universe = new Struct({
		name: 'universe',
		structure: {
			name: text('name').notNull(),
			description: text('description').notNull(),
			public: boolean('public').notNull()
		}
	});

	Account.Account.queryListen('universe-members', async (event, data) => {
		const session = (await Session.getSession(event)).unwrap();
		const account = (await Session.getAccount(session)).unwrap();

		if (!account) {
			throw new Error('Not logged in');
		}

		const universeId = z.object({
			universe: z.string(),
		}).parse(data).universe;

		const universe = (await Universe.fromId(universeId)).unwrap();
		if (!universe) throw new Error('Universe not found');

		const members = (await getMembers(universe)).unwrap();
		if (!members.find(m => m.id !== account.id)) {
			throw new Error('Not a member of this universe, cannot read members');
		}
		const stream = new StructStream(Account.Account);
		setTimeout(() => {
			for (let i = 0; i < members.length; i++) {
				stream.add(members[i]);
			}
		});
		return stream;
	});

	Universe.on('delete', (u) => {
		Struct.each((s) => {
			s.each((d) => {
				d.removeUniverses(u.id);
			});

			UniverseInvites.fromProperty('universe', u.id, {
				type: 'stream'
			}).pipe((i) => i.delete());
		});
	});

	export type UniverseData = typeof Universe.sample;

	export const getUniverses = async (account: Account.AccountData) => {
		return attemptAsync(async () => {
			return resolveAll(
				await Promise.all(
					account
						.getUniverses()
						.unwrap()
						.map((u) => Universes.Universe.fromId(u))
				)
			)
				.unwrap()
				.filter(Boolean) as Universes.UniverseData[];
		});
	};

	export const UniverseInvites = new Struct({
		name: 'universe_invite',
		structure: {
			universe: text('universe').notNull(),
			account: text('account').notNull(),
			inviter: text('inviter').notNull()
		}
	});

	export type UniverseInviteData = typeof UniverseInvites.sample;

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
					permissions: '["*"]',
					description: `${u.data.name} Aministrator`,
				}, {
					static: true,
				})
			).unwrap();
			const member = (
				await Permissions.Role.new({
					universe: u.id,
					name: 'Member',
					permissions: '[]',
					description: `${u.data.name} Member`,
				}, {
					static: true,
				})
			).unwrap();
			(await account.addUniverses(u.id)).unwrap();
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
				await UniverseInvites.new({
					universe: universe.id,
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
				.from(UniverseInvites.table)
				.innerJoin(Universe.table, eq(UniverseInvites.table.universe, Universe.table.id))
				.limit(config.limit)
				.offset(config.offset)
				.where(sql`${UniverseInvites.table.account} = ${account.id}`);

			return res.map((r) => ({
				invite: UniverseInvites.Generator(r.universe_invite),
				universe: Universe.Generator(r.universe)
			}));
		});
	};

	export const acceptInvite = async (invite: UniverseInviteData) => {
		return attemptAsync(async () => {
			const { account, universe } = invite.data;

			const a = await (await Account.Account.fromId(account)).unwrap();
			if (!a) return;

			const roles = (await Permissions.Role.fromProperty('universe', universe, {
				type: 'stream',
			}).await()).unwrap();

			const member = roles.find((r) => r.data.name === 'Member'); // should always succeed because data is static

			if (!member) throw new Error('Member role not found');

			(await Permissions.RoleAccount.new({
				account: a.id,
				role: member.id
			})).unwrap();

			(await invite.delete()).unwrap();
		});
	};

	export const declineInvite = async (invite: UniverseInviteData) => {
		return invite.delete();
	};

	export const isMember = async (account: Account.AccountData, universe: Universes.UniverseData) => {
		return attemptAsync(async () => {
		});
	};

	export const getMembers = async (universe: UniverseData) => {
		return attemptAsync(async () => {
			const data = await Universe.database
				.select()
				.from(Account.Account.table)
				.innerJoin(Permissions.RoleAccount.table, eq(Account.Account.table.id, Permissions.RoleAccount.table.account))
				.innerJoin(Permissions.Role.table, eq(Permissions.RoleAccount.table.role, Permissions.Role.table.id))
				.where(eq(Permissions.Role.table.universe, universe.id));
			
			return data.map((d) => Account.Account.Generator(d.account));
		});
	};
}

export const _universeTable = Universes.Universe.table;
export const _universeInviteTable = Universes.UniverseInvites.table;

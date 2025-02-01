import { text, json, boolean } from 'drizzle-orm/pg-core';
import {
	DataError,
	Struct,
	StructData,
	StructStream,
	type Blank,
	type Structable
} from 'drizzle-struct/back-end';
import { attempt, attemptAsync, resolveAll, type Result } from 'ts-utils/check';
import type { Account } from './account';
import { PropertyAction, DataAction } from 'drizzle-struct/types';
import { Stream } from 'ts-utils/stream';
import { Universes } from './universe';
import { z } from 'zod';
import { Session } from './session';
import { DB } from '../db';
import { and, eq } from 'drizzle-orm';
import { readEntitlement, type EntitlementPermission } from '../utils/entitlements';
import type { Entitlement } from '$lib/types/entitlements';

export namespace Permissions {
	export const Role = new Struct({
		name: 'role',
		structure: {
			name: text('name').notNull(),
			universe: text('universe').notNull(),
			description: text('description').notNull(),
			links: text('links').notNull(),
			entitlements: text('entitlements').notNull().default('[]'),
		},
		generators: {
			links: () => JSON.stringify([]),
			entitlements: () => JSON.stringify([]),
		}
	});

	Role.block(PropertyAction.Update, () => true, 'Not allowed to update Roles through the API.');

	// Role.callListen('update-links', async (event, data) => {});

	// Role.callListen('update-role', async (event, data) => {});

	export type RoleData = typeof Role.sample;

	export const entitlementsFromRole = async (role: RoleData) => {
		return attemptAsync(async () => {
			const entitlements = JSON.parse(role.data.entitlements);
			return resolveAll<EntitlementPermission>(await Promise.all(entitlements.map((e: string) => {
				return readEntitlement(e as Entitlement);
			}))).unwrap();
		});
	};

	export const RoleAccount = new Struct({
		name: 'role_account',
		structure: {
			role: text('role').notNull(),
			account: text('account').notNull()
		},
		frontend: false
	});

	export type RoleAccountData = typeof RoleAccount.sample;

	export const getRolesFromUniverse = async (universe: Universes.UniverseData) => {
		return Role.fromProperty('universe', universe.id, {
			type: 'stream'
		}).await();
	};

	export const getUniverseAccountRoles = async (
		account: Account.AccountData,
		universe: Universes.UniverseData
	) => {
		return attemptAsync(async () => {
			const data = await DB.select()
				.from(Role.table)
				.innerJoin(RoleAccount.table, eq(Role.table.id, RoleAccount.table.role))
				.where(
					and(eq(RoleAccount.table.account, account.id), eq(Role.table.universe, universe.id))
				);

			return data.map((d) => Role.Generator(d.role));
		});
	};

	export const allAccountRoles = async (account: Account.AccountData) => {
		return attemptAsync(async () => {
			const roleAccounts = (
				await RoleAccount.fromProperty('account', account.id, {
					type: 'stream'
				}).await()
			).unwrap();
			return resolveAll(
				await Promise.all(roleAccounts.map(async (ra) => Role.fromId(ra.data.role)))
			)
				.unwrap()
				.filter(Boolean) as RoleData[];
		});
	};

	export const giveRole = async (account: Account.AccountData, role: RoleData) => {
		return attemptAsync(async () => {
			if (role.data.name !== 'root') {
				const roles = (await allAccountRoles(account)).unwrap();
				if (roles.find((r) => r.id === role.id)) {
					return;
				}
			}

			return (
				await RoleAccount.new({
					role: role.id,
					account: account.id
				})
			).unwrap();
		});
	};


	// TODO: This isn't really typed correctly. As of right now, the output is using the generic Struct<Blank, string> type rather than the actual struct type that's passed in.
	export const filterAction = async <
		S extends Struct<Blank, string>,
		D extends StructData<S['data']['structure'], S['data']['name']>
	>(
		roles: RoleData[],
		data: D[],
		action: PropertyAction
	): Promise<Result<Partial<Structable<S['data']['structure']>>[]>> => {
		return attemptAsync(async () => {
			if (
				data.filter((v, i, a) => a.findIndex((d) => d.struct.name === v.struct.name) === i).length >
				1
			) {
				throw new DataError(Role, 'Data must be from the same struct');
			}

			const struct = data[0].struct.name;
			if (!struct) {
				return [];
			}

			const universes = roles.map((r) => r.data.universe);
			const allEntitlements = resolveAll(await Promise.all(roles.map((r) => entitlementsFromRole(r))))
				.unwrap()
				.flat();

			const usedEntitlements = allEntitlements
				// TODO: if action is readversionhistory or readarchive, properties should be filtered by the read permissions
				.filter((p) => p.struct === struct && p.permissions.some(p => p.action === action || p.action === '*'));

			return data
				.filter((d) => {
					const dataUniverses = d.getUniverses().unwrap();
					return dataUniverses.some((du) => universes.includes(du));
				})
				.map((d) => {
					const { data } = d;
					const properties: string[] = usedEntitlements
						.map((e) => e.permissions.map(perm => perm.property))
						.flat()
						.concat('id', 'created', 'updated', 'archived', 'universes', 'lifetime', 'attributes')
						.filter((v, i, a) => a.indexOf(v) === i)
						.filter(Boolean) as string[];

					return Object.fromEntries(properties.map((p) => [p, data[p]])) as Partial<
						Structable<S['data']['structure']>
					>;
				});
		});
	};

	export const filterActionPipeline = <
		S extends Struct<Blank, string>,
		Stream extends StructStream<S['data']['structure'], S['data']['name']>
	>(
		account: Account.AccountData,
		roles: RoleData[],
		stream: Stream,
		action: PropertyAction,
		bypass: ((account: Account.AccountData, data?: StructData<Blank, string>) => boolean)[]
	) => {
		const newStream = new Stream<Partial<Structable<S['data']['structure']>>>();

		setTimeout(async () => {
			const universes = roles.map((r) => r.data.universe);

			const entitlements = resolveAll(await Promise.all(roles.map(r => entitlementsFromRole(r))))
				.unwrap()
				.flat()
				.filter(e => e.permissions.some(p => p.action === action) && e.struct === stream.struct.data.name);


			stream.pipe((d) => {
				if (bypass.some((b) => b(account, d))) {
					return newStream.add(d.safe());
				}

				const dataUniverses = d.getUniverses().unwrap();
				if (dataUniverses.some((du) => universes.includes(du))) {
					const { data } = d;
					const properties: string[] = entitlements
						.map(e => e.permissions.map(p => p.property))
						.flat()
						.concat(
							'id',
							'created',
							'updated',
							'archived',
							'universes',
							'lifetime',
							'attributes',
							'canUpdate'
						)
						.filter((v, i, a) => a.indexOf(v) === i)
						.filter(Boolean) as string[];

					newStream.add(
						Object.fromEntries(properties.map((p) => [p, data[p]])) as Partial<
							Structable<S['data']['structure']>
						>
					);
				}
			});
		});

		return newStream;
	};

	// global permissions
	export const canDo = (roles: RoleData[], struct: Struct<Blank, string>, action: DataAction) => {
		return attemptAsync(async () => {
		});
	};

	export const canAccess = (roles: RoleData[], link: string) => {
		return attemptAsync(async () => {});
	};

	export const isEntitled = (roles: RoleData[], entitlement: string, universe?: Universes.UniverseData) => {
		return attemptAsync(async () => {});
	};
}

// for drizzle
export const _roleTable = Permissions.Role.table;
export const _roleAccountTable = Permissions.RoleAccount.table;

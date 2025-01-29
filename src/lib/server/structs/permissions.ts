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

export namespace Permissions {
	type DP = {
		permission: PropertyAction | DataAction;
		struct: string;
		property?: string;
	};

	export class DataPermission {
		static stringify(permissions: DataPermission[]): Result<string> {
			return attempt(() => {
				return JSON.stringify(permissions);
			});
		}

		static parse(permissions: string): Result<DataPermission[] | '*'> {
			return attempt(() => {
				const result = JSON.parse(permissions) as (DP | '*')[];
				if (result.includes('*')) return '*';
				return (result as DP[]).map((p) => new DataPermission(p.permission, p.struct, p.property));
			});
		}

		constructor(
			public readonly permission: PropertyAction | DataAction,
			public readonly struct: string,
			public readonly property?: string // If property is undefined, it means the permission is for the whole struct
		) {}
	}

	export const Role = new Struct({
		name: 'role',
		structure: {
			name: text('name').notNull(),
			universe: text('universe').notNull(),
			description: text('description').notNull(),
			permissions: text('permissions').notNull(),
			links: text('links').notNull(),
		},
		generators: {
			permissions: () => JSON.stringify([]),
			links: () => JSON.stringify([]),
		}
	});

	Role.block(PropertyAction.Update, () => true, 'Not allowed to update Roles through the API.');

	Role.callListen('update-permissions', async (event, data) => {
		const session = await Session.getSession(event);
		if (session.isErr()) {
			return {
				success: false,
				message: 'Invalid session',
			}
		}
		const account = await Session.getAccount(session.value);
		if (account.isErr() || !account.value) {
			return {
				success: false,
				message: 'Invalid account',
			}
		}

		const res = z.object({
			role: z.string(),
			permissions: z.string(),
		}).safeParse(data);

		if (res.error) {
			return {
				success: false,
				message: 'Invalid data types recieved',
			}
		}

		const role = await Role.fromId(res.data.role);
		if (role.isErr() || !role.value) {
			return {
				success: false,
				message: 'Invalid role',
			}
		}

		const permissions = DataPermission.parse(role.value.data.permissions);

		if (permissions.isErr()) {
			return {
				success: false,
				message: 'Invalid permissions pulled from role',
			}
		}

		if (permissions.value === '*') {
			return {
				success: false,
				message: 'Cannot update permissions from a role with global permissions',
			}
		}

		const universe = await Universes.Universe.fromId(role.value.data.universe);

		if (universe.isErr() || !universe.value) {
			return {
				success: false,
				message: 'Invalid universe',
			}
		}

		const updatePerms = DataPermission.parse(res.data.permissions);

		if (updatePerms.isErr()) {
			return {
				success: false,
				message: 'Invalid permissions',
			}
		}

		if (updatePerms.value === '*') {
			return {
				success: false,
				message: 'Cannot set permissions to global',
			}
		}

		const roles = await getUniverseAccountRoles(account.value, universe.value);
		if (roles.isErr()) {
			return {
				success: false,
				message: 'Invalid roles',
			}
		}

		const update = async () => (await role.value?.update({
			permissions: res.data.permissions,
		}))?.unwrap();

		// a user may not grant permissions they do not have to other roles
		const userPerms = resolveAll(roles.value.map(r => permissionsFromRole(r))).unwrap().flat();
		if (userPerms.includes('*')) {
			update();
			return {
				success: true,
				message: 'Permissions updated',
			}
		}

		const userDataPerms = userPerms.filter(p => p instanceof DataPermission);
		const updateDataPerms = updatePerms.value.filter(p => p instanceof DataPermission);

		const diff = updateDataPerms.filter(p => !userDataPerms.find(up => up.permission === p.permission && up.struct === p.struct && up.property === p.property));

		if (diff.length > 0) {
			return {
				success: false,
				message: 'Invalid permissions',
			}
		}

		update();

		return {
			success: true,
			message: 'Permissions updated',
		}
	});

	// Role.callListen('update-links', async (event, data) => {});

	// Role.callListen('update-role', async (event, data) => {});

	export type RoleData = typeof Role.sample;

	export const RoleAccount = new Struct({
		name: 'role_account',
		structure: {
			role: text('role').notNull(),
			account: text('account').notNull()
		},
		frontend: false,
	});

	export type RoleAccountData = typeof RoleAccount.sample;

	export const getRolesFromUniverse = async (universe: Universes.UniverseData) => {
		return Role.fromProperty('universe', universe.id, {
			type: 'stream'
		}).await();
	};

	export const getUniverseAccountRoles = async (account: Account.AccountData, universe: Universes.UniverseData) => {
		return attemptAsync(async () => {
			const data = await DB.select()
				.from(Role.table)
				.innerJoin(RoleAccount.table, eq(Role.table.id, RoleAccount.table.role))
				.where(
					and(
						eq(RoleAccount.table.account, account.id),
						eq(Role.table.universe, universe.id)
					)
				);

			return data.map(d => Role.Generator(d.role));
		});
	}

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

	export const permissionsFromRole = (role: RoleData) => {
		return DataPermission.parse(role.data.permissions);
	};

	// export const permissionsFromAccount = async (
	//     account: Account.AccountData
	// ) => {
	//     return attemptAsync(async () => {
	//         // TODO: Make permissionsFromAccount()
	//     });
	// };

	export const setPermissions = async (role: RoleData, permissions: DataPermission[]) => {
		return role.update({
			permissions: DataPermission.stringify(permissions).unwrap()
		});
	};

	export const givePermission = async (role: RoleData, permission: DataPermission) => {
		return attemptAsync(async () => {
			const permissions = (await permissionsFromRole(role)).unwrap();
			if (permissions === '*') return;
			permissions.push(permission);
			return setPermissions(role, permissions);
		});
	};

	export const removePermission = async (role: RoleData, permission: DataPermission) => {
		return attemptAsync(async () => {
			const permissions = (await permissionsFromRole(role)).unwrap();
			if (permissions === '*') return;
			const index = permissions.findIndex(
				(p) =>
					p.permission === permission.permission &&
					p.struct === permission.struct &&
					p.property === permission.property
			);
			if (index === -1) {
				return;
			}

			permissions.splice(index, 1);
			return (await setPermissions(role, permissions)).unwrap();
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
			const allPerms = resolveAll(roles.map((r) => permissionsFromRole(r))).unwrap().flat();
			if (allPerms.includes('*')) {
				return data.map(d => d.data);
			}
			const permissions = allPerms
				.filter(p => p instanceof DataPermission)
				// TODO: if action is readversionhistory or readarchive, properties should be filtered by the read permissions
				.filter((p) => p.permission === action && p.struct === struct);

			return data
				.filter((d) => {
					const dataUniverses = d.getUniverses().unwrap();
					return dataUniverses.some((du) => universes.includes(du));
				})
				.map((d) => {
					const { data } = d;
					const properties: string[] = permissions
						.map((p) => p.property)
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
			const allPerms = resolveAll(roles.map((r) => permissionsFromRole(r))).unwrap().flat();
			if (allPerms.includes('*')) {
				stream.pipe((d) =>{
					newStream.add(d.data);
				});
				return;
			}

			const permissions = allPerms
				.filter((p) => p instanceof DataPermission)
				.filter((p) => p.permission === action && p.struct === stream.struct.name);

			stream.pipe((d) => {
				if (bypass.some((b) => b(account, d))) {
					return newStream.add(d.data);
				}

				const dataUniverses = d.getUniverses().unwrap();
				if (dataUniverses.some((du) => universes.includes(du))) {
					const { data } = d;
					const properties: string[] = permissions
						.map((p) => p.property)
						.concat('id', 'created', 'updated', 'archived', 'universes', 'lifetime', 'attributes', 'canUpdate')
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
		return attempt(() => {
			const allPerms = resolveAll(roles.map((r) => permissionsFromRole(r))).unwrap();
			if (allPerms.includes('*')) {
				return true;
			}
			const permissions = allPerms
				.flat()
				.filter((p) => p instanceof DataPermission)
				.filter((p) => p.permission === action && p.struct === struct.name);

			return permissions.length > 0;
		});
	};

	// const cantAccess = (req: Req) =>
	//     new Status(
	//         {
	//             code: 403,
	//             message: 'You do not have permission to access this resource',
	//             color: 'danger',
	//             instructions: ''
	//         },
	//         'Permissions',
	//         'Invalid',
	//         '{}',
	//         req
	//     );

	// export const canAccess =
	//     (
	//         fn: (
	//             account: Account.AccountData,
	//             roles: RoleData[]
	//         ) => Promise<boolean> | boolean
	//     ): ServerFunction =>
	//     async (req, res, next) => {
	//         if (!(await req.getSession()).unwrap().data.accountId) {
	//             return res.sendCustomStatus(cantAccess(req));
	//         }

	//         const account = (await Session.getAccount(req.sessionId)).unwrap();

	//         if (!account) return res.sendCustomStatus(cantAccess(req));

	//         const roles = (await getRoles(account)).unwrap();

	//         if (!(await fn(account, roles)))
	//             return res.sendCustomStatus(cantAccess(req));

	//         next();
	//     };

	// export const forceUniverse =
	//     (
	//         getUniverse: (
	//             session: Session.SessionData
	//         ) => Promise<UniverseData | undefined> | UniverseData | undefined
	//     ): ServerFunction =>
	//     async (req, res, next) => {
	//         const session = (await req.getSession()).unwrap();
	//         if (!session) throw new Error('Session not found');
	//         const universe = await getUniverse(session);
	//         if (universe) {
	//             req.universe = universe.id;
	//             const rooms = req.socket?.rooms;
	//             if (rooms && !rooms.has(universe.id)) {
	//                 req.socket.join(universe.id);
	//             }
	//         }
	//         next();
	//     };


	export const canAccess = (roles: RoleData[], link: string) => {
		return roles.some((r) => {
			const links = z.array(z.string()).parse(JSON.parse(r.data.links));
			return links.includes('*') || links.includes(link);
		});
	}
}

// for drizzle
export const _roleTable = Permissions.Role.table;
export const _roleAccountTable = Permissions.RoleAccount.table;

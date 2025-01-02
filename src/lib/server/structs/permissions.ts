// import { text } from "drizzle-orm/pg-core";
// import { DataError, Struct, StructData, StructStream, type Blank, type Structable } from "drizzle-struct/src/back-end";
// import { attempt, attemptAsync, resolveAll, type Result } from "ts-utils/check";
// import { decode, encode } from "ts-utils/text";
// import type { Account } from "./account";
// import { PropertyAction, DataAction } from "drizzle-struct/src/types";
// import { Stream } from "ts-utils/stream";

// export namespace Permissions {
//     export class DataPermission {
//         static stringify(permissions: DataPermission[]): Result<string> {
//             return attempt(() => {
//                 let result = '';
//                 for (const p of permissions) {
//                     result +=
//                         [p.permission, p.struct, p.property || '']
//                             .map(encode)
//                             .join(',') + ';';
//                 }

//                 return result;
//             });
//         }

//         static parse(permissions: string): Result<DataPermission[]> {
//             return attempt(() => {
//                 const result: DataPermission[] = [];
//                 const parts = permissions.split(';');
//                 for (const part of parts) {
//                     const [permission, struct, property] = part
//                         .split(',')
//                         .map(decode);
//                     result.push(
//                         new DataPermission(
//                             permission as PropertyAction,
//                             struct,
//                             property
//                         )
//                     );
//                 }

//                 return result;
//             });
//         }

//         constructor(
//             public readonly permission: PropertyAction | DataAction,
//             public readonly struct: string,
//             public readonly property?: string // If property is undefined, it means the permission is for the whole struct
//         ) {}

//         // toString() {
//         //     return `${this.permission}: ${this.struct}.${this.property}`;
//         // }
//     }

//     export const Universe = new Struct({
//         name: 'universe',
//         structure: {
//             name: text('name').notNull(),
//             description: text('description').notNull(),
//         },
//     });

//     Universe.on('delete', u => {
//         Struct.each(s => {
//             s.each(d => {
//                 d.removeUniverses(u.id);
//             });
//         });
//     });

//     export type UniverseData = typeof Universe.sample;

//     export const Role = new Struct({
//         name: 'role',
//         structure: {
//             name: text('name').notNull(),
//             universe: text('universe').notNull(),
//             description: text('description').notNull(),
//             permissions: text('permissions').notNull(),
//         }
//     });

//     export type RoleData = typeof Role.sample;

//     export const RoleAccount = new Struct({
//         name: 'role_account',
//         structure: {
//             role: text('role').notNull(),
//             account: text('account').notNull(),
//         }
//     });

//     export type RoleAccountData = typeof RoleAccount.sample;

//     export const getRolesFromUniverse = async (
//         universe: UniverseData
//     ) => {
//         return Role.fromProperty('universe', universe.id, false);
//     }

//     export const getRoles = async (account: Account.AccountData) => {
//         return attemptAsync(async () => {
//             const roleAccounts = (
//                 await RoleAccount.fromProperty('account', account.id, false)
//             ).unwrap();
//             return resolveAll(
//                 await Promise.all(
//                     roleAccounts.map(async ra => Role.fromId(ra.data.role))
//                 )
//             )
//                 .unwrap()
//                 .filter(Boolean) as RoleData[];
//         });
//     };

    
//     export const giveRole = async (
//         account: Account.AccountData,
//         role: RoleData
//     ) => {
//         return attemptAsync(async () => {
//             if (role.data.name !== 'root') {
//                 const roles = (await getRoles(account)).unwrap();
//                 if (roles.find(r => r.id === role.id)) {
//                     return;
//                 }
//             }

//             return (
//                 await RoleAccount.new({
//                     role: role.id,
//                     account: account.id
//                 })
//             ).unwrap();
//         });
//     };

//     export const permissionsFromRole = (role: RoleData) => {
//         return DataPermission.parse(role.data.permissions);
//     };

//     // export const permissionsFromAccount = async (
//     //     account: Account.AccountData
//     // ) => {
//     //     return attemptAsync(async () => {
//     //         // TODO: Make permissionsFromAccount()
//     //     });
//     // };

//     export const setPermissions = async (
//         role: RoleData,
//         permissions: DataPermission[]
//     ) => {
//         return role.update({
//             permissions: DataPermission.stringify(permissions).unwrap()
//         });
//     };

//     export const givePermission = async (
//         role: RoleData,
//         permission: DataPermission
//     ) => {
//         return attemptAsync(async () => {
//             const permissions = (await permissionsFromRole(role)).unwrap();
//             permissions.push(permission);
//             return setPermissions(role, permissions);
//         });
//     };

//     export const removePermission = async (
//         role: RoleData,
//         permission: DataPermission
//     ) => {
//         return attemptAsync(async () => {
//             const permissions = (await permissionsFromRole(role)).unwrap();
//             const index = permissions.findIndex(
//                 p =>
//                     p.permission === permission.permission &&
//                     p.struct === permission.struct &&
//                     p.property === permission.property
//             );
//             if (index === -1) {
//                 return;
//             }

//             permissions.splice(index, 1);
//             return (await setPermissions(role, permissions)).unwrap();
//         });
//     };

//     // TODO: This isn't really typed correctly. As of right now, the output is using the generic Struct<Blank, string> type rather than the actual struct type that's passed in.
//     export const filterAction = async <
//         S extends Struct<Blank, string>,
//         D extends StructData<S['data']['structure'], S['data']['name']>
//     >(
//         roles: RoleData[],
//         data: D[],
//         action: PropertyAction
//     ): Promise<Result<Partial<Structable<S['data']['structure']>>[]>> => {
//         return attemptAsync(async () => {
//             if (
//                 data.filter(
//                     (v, i, a) =>
//                         a.findIndex(d => d.struct.name === v.struct.name) === i
//                 ).length > 1
//             ) {
//                 throw new DataError('Data must be from the same struct');
//             }

//             const struct = data[0].struct.name;
//             if (!struct) {
//                 return [];
//             }

//             const universes = roles.map(r => r.data.universe);
//             const permissions = resolveAll(
//                 roles.map(r => permissionsFromRole(r))
//             )
//                 .unwrap()
//                 .flat()
//                 // TODO: if action is readversionhistory or readarchive, properties should be filtered by the read permissions
//                 .filter(p => p.permission === action && p.struct === struct);

//             return data
//                 .filter(d => {
//                     const dataUniverses = d.getUniverses().unwrap();
//                     return dataUniverses.some(du => universes.includes(du));
//                 })
//                 .map(d => {
//                     const { data } = d;
//                     const properties: string[] = permissions
//                         .map(p => p.property)
//                         .concat(
//                             'id',
//                             'created',
//                             'updated',
//                             'archived',
//                             'universes',
//                             'lifetime',
//                             'attributes'
//                         )
//                         .filter((v, i, a) => a.indexOf(v) === i)
//                         .filter(Boolean) as string[];

//                     return Object.fromEntries(
//                         properties.map(p => [p, data[p]])
//                     ) as Partial<Structable<S['data']['structure']>>;
//                 });
//         });
//     };

//     export const filterActionPipeline = <
//         S extends Struct<Blank, string>,
//         Stream extends StructStream<S['data']['structure'], S['data']['name']>
//     >(account: Account.AccountData, roles: RoleData[], stream: Stream, action: PropertyAction, bypass: ((account: Account.AccountData, data?: StructData<Blank, string>) => boolean)[]) => {
//         const newStream = new Stream<Partial<Structable<S['data']['structure']>>>();

//         (async () => {
//             const universes = roles.map(r => r.data.universe);
//             const permissions = resolveAll(
//                 roles.map(r => permissionsFromRole(r))
//             )
//                 .unwrap()
//                 .flat()
//                 .filter(p => p.permission === action && p.struct === stream.struct.name);

//             stream.pipe((d) => {
//                 if (bypass.some(b => b(account, d))) {
//                     return newStream.add(d.data);
//                 }

//                 const dataUniverses = d.getUniverses().unwrap();
//                 if (dataUniverses.some(du => universes.includes(du))) {
//                     const { data } = d;
//                     const properties: string[] = permissions
//                         .map(p => p.property)
//                         .concat(
//                             'id',
//                             'created',
//                             'updated',
//                             'archived',
//                             'universes',
//                             'lifetime',
//                             'attributes'
//                         )
//                         .filter((v, i, a) => a.indexOf(v) === i)
//                         .filter(Boolean) as string[];

//                     newStream.add(
//                         Object.fromEntries(
//                             properties.map(p => [p, data[p]])
//                         ) as Partial<Structable<S['data']['structure']>>
//                     );
//                 }
//             });
//         })();

//         return newStream;
//     }

//     // global permissions
//     export const canDo = (
//         roles: RoleData[],
//         struct: Struct<Blank, string>,
//         action: DataAction
//     ) => {
//         return attempt(() => {
//             const permissions = resolveAll(
//                 roles.map(r => permissionsFromRole(r))
//             )
//                 .unwrap()
//                 .flat()
//                 .filter(
//                     p => p.permission === action && p.struct === struct.name
//                 );

//             return permissions.length > 0;
//         });
//     };

//     // const cantAccess = (req: Req) =>
//     //     new Status(
//     //         {
//     //             code: 403,
//     //             message: 'You do not have permission to access this resource',
//     //             color: 'danger',
//     //             instructions: ''
//     //         },
//     //         'Permissions',
//     //         'Invalid',
//     //         '{}',
//     //         req
//     //     );

//     // export const canAccess =
//     //     (
//     //         fn: (
//     //             account: Account.AccountData,
//     //             roles: RoleData[]
//     //         ) => Promise<boolean> | boolean
//     //     ): ServerFunction =>
//     //     async (req, res, next) => {
//     //         if (!(await req.getSession()).unwrap().data.accountId) {
//     //             return res.sendCustomStatus(cantAccess(req));
//     //         }

//     //         const account = (await Session.getAccount(req.sessionId)).unwrap();

//     //         if (!account) return res.sendCustomStatus(cantAccess(req));

//     //         const roles = (await getRoles(account)).unwrap();

//     //         if (!(await fn(account, roles)))
//     //             return res.sendCustomStatus(cantAccess(req));

//     //         next();
//     //     };

//     // export const forceUniverse =
//     //     (
//     //         getUniverse: (
//     //             session: Session.SessionData
//     //         ) => Promise<UniverseData | undefined> | UniverseData | undefined
//     //     ): ServerFunction =>
//     //     async (req, res, next) => {
//     //         const session = (await req.getSession()).unwrap();
//     //         if (!session) throw new Error('Session not found');
//     //         const universe = await getUniverse(session);
//     //         if (universe) {
//     //             req.universe = universe.id;
//     //             const rooms = req.socket?.rooms;
//     //             if (rooms && !rooms.has(universe.id)) {
//     //                 req.socket.join(universe.id);
//     //             }
//     //         }
//     //         next();
//     //     };
// }

// // for drizzle
// export const _universeTable = Permissions.Universe.table;
// export const _roleTable = Permissions.Role.table;
// export const _roleAccountTable = Permissions.RoleAccount.table;
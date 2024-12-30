/* eslint-disable @typescript-eslint/no-explicit-any */
import { pgTable, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import type { PgColumnBuilderBase, PgTableWithColumns } from 'drizzle-orm/pg-core';
import { sql, type BuildColumns } from 'drizzle-orm';
import { attempt, attemptAsync, resolveAll, type Result } from '$lib/ts-utils/check';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { type ColumnDataType } from 'drizzle-orm';
import { EventEmitter } from '$lib/ts-utils/event-emitter';
import { Loop } from '$lib/ts-utils/loop';
import { uuid } from './utils/uuid';
import type { RequestEvent } from '../../routes/struct/$types';
// import { match } from '$lib/ts-utils/match';
import { PropertyAction, DataAction } from '$lib/types';
import { encode, fromCamelCase, toSnakeCase } from '$lib/ts-utils/text';
import { Stream } from '$lib/ts-utils/stream';

export class StructError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StructError';
    }
}

export class FatalStructError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FatalStructError';
    }
}

export class DataError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DataError';
    }
}

export class FatalDataError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FatalDataError';
    }
}

export type Blank = Record<string, PgColumnBuilderBase>;

export type StructBuilder<T extends Blank, Name extends string> = {
    database: PostgresJsDatabase;
    name: Name;
    structure: T;
    sample?: boolean;
    loop?: {
        fn: (data: StructData<T, Name>, index: number) => void;
        time: number;
    }
    frontend?: boolean;
    defaultUniverses?: string[];
    generators?: Partial<{
        id: () => string;
        attributes: () => string[];
    }>;
    versionHistory?: {
        type: 'days' | 'versions';
        amount: number;
    };
    universeLimit?: number;
    // This is so the struct isn't actually saved in the database, it 'reflects' a different server's data
    // If there are merge conflicts, it will always prioritize the other server's data
    // It will still save in the local database for optimization purposes
    // If there are type conflicts, they are incompatible, so it will throw an error
    reflect?: {
        webhook: string;
        headers: Record<string, string>;
        // How often it should sync with the other server
        // it will first send a hash of the data, and if the other server doesn't have that hash, the other server will pipe the data
        interval: number;
    };
};


export type Data<T extends Struct<Blank, string>> = T['sample'];


const globalCols = {
    id: text('id').primaryKey(),
    created: timestamp<'created', 'string'>('created').notNull(),
    updated: timestamp<'updated', 'string'>('updated').notNull(),
    archived: boolean<'archived'>('archived').default(false).notNull(),
    universes: text('universes').notNull(),
    attributes: text('attributes').notNull(),
    lifetime: integer('lifetime').notNull(),
};

type Table<T extends Blank, TableName extends string> = PgTableWithColumns<{
    name: TableName;
    schema: undefined;
    columns: BuildColumns<TableName, T, 'pg'>;
    dialect: "pg";
}>;

export type Structable<T extends Blank> = {
    [K in keyof T]: TsType<T[K]['_']['dataType']>;
}

export class StructStream<T extends Blank = Blank, Name extends string = string> extends Stream<StructData<T, Name>> {
    constructor(public readonly struct: Struct<T, Name>) {
        super();
    }
}

const versionGlobalCols = {
    vhId: text('vh_id').primaryKey(),
    id: text('id').notNull(), // Used to overwrite the other primary key
    vhCreated: timestamp<'vh_created', 'string'>('vh_created').notNull(),
};

export class DataVersion<T extends Blank, Name extends string> {
    constructor(public readonly struct: Struct<T, Name>, public readonly data: Structable<T & typeof globalCols & typeof versionGlobalCols>) {}

    get vhId() {
        return this.data.vhId;
    }

    get id() {
        return this.data.id;
    }

    get created() {
        return new Date(this.data.created);
    }

    get updated() {
        return new Date(this.data.updated);
    }

    get archived() {
        return this.data.archived;
    }

    get vhCreated() {
        return new Date(this.data.vhCreated);
    }

    get database() {
        return this.struct.database;
    }

    delete() {
        return attemptAsync(async () => {
            if (!this.struct.versionTable) throw new StructError(`Struct ${this.struct.name} does not have a version table`);
            await this.database.delete(this.struct.versionTable).where(sql`${this.struct.versionTable.vhId} = ${this.vhId}`);
            this.struct.emit('delete-version', this);
        });
    }

    restore() {
        return attemptAsync(async () => {
            const data = (await this.struct.fromId(this.id)).unwrap();
            if (!data) this.struct.new(this.data);
            else await data.update(this.data);
            this.struct.emit('restore-version', this);
        });
    }
}

export class StructData<T extends Blank, Name extends string> {
    constructor(public readonly data: Structable<T & typeof globalCols>, public readonly struct: Struct<T, Name>) {}

    get id() {
        return this.data.id;
    }

    get created() {
        return new Date(this.data.created);
    }

    get updated() {
        return new Date(this.data.updated);
    }

    get archived() {
        return this.data.archived;
    }

    get database() {
        return this.struct.database;
    }

    get lifetime() {
        return this.data.lifetime;
    }

    update(data: Partial<Structable<T>>) {
        return attemptAsync(async () => {
            this.makeVersion();
            const newData: any = { ...this.data, ...data };

            // Remove global columns
            delete newData.id;
            delete newData.created;
            delete newData.updated;
            delete newData.archived;
            delete newData.universes;
            delete newData.attributes;
            delete newData.lifetime;
            await this.database.update(this.struct.table).set({
                ...newData,
                updated: new Date(),
            }).where(sql`${this.struct.table.id} = ${this.id}`);
        });
    }

    setArchive(archived: boolean) {
        return attemptAsync(async () => {
            await this.struct.database.update(this.struct.table).set({
                archived,
                updated: new Date(),
            } as any).where(sql`${this.struct.table.id} = ${this.id}`);
        });
    }

    delete() {
        return attemptAsync(async () => {
            this.makeVersion();
            await this.database.delete(this.struct.table).where(sql`${this.struct.table.id} = ${this.id}`);
        });
    }

    makeVersion() {
        return attemptAsync(async () => {
            if (!this.struct.versionTable) throw new StructError(`Struct ${this.struct.name} does not have a version table`);
            const vhId = uuid();
            const vhCreated = new Date();
            const vhData = { ...this.data, vhId, vhCreated } as any;
            await this.database.insert(this.struct.versionTable).values(vhData);

            const prev = (await this.getVersions()).unwrap();
            if (this.struct.data.versionHistory) {
                if (this.struct.data.versionHistory.type === 'days') {
                    const days = this.struct.data.versionHistory.amount;
                    const date = new Date();
                    date.setDate(date.getDate() - days);
                    const toDelete = prev.filter(v => v.vhCreated < date);
                    for (const v of toDelete) {
                        await v.delete();
                    }
                } else if (this.struct.data.versionHistory.type === 'versions') {
                    const amount = this.struct.data.versionHistory.amount;
                    const toDelete = prev.slice(0, prev.length - amount);
                    for (const v of toDelete) {
                        await v.delete();
                    }
                }
            }

            return new DataVersion(this.struct, vhData);
        });
    }

    getVersions() {
        return attemptAsync(async () => {
            if (!this.struct.versionTable) throw new StructError(`Struct ${this.struct.name} does not have a version table`);
            const data = await this.database.select().from(this.struct.versionTable).where(sql`${this.struct.versionTable.id} = ${this.id}`);
            return data.map(d => new DataVersion(this.struct, d as any));
        });
    }

    getAttributes() {
        return attempt(() => {
            const a = JSON.parse(this.data.attributes);
            if (!Array.isArray(a)) throw new DataError('Attributes must be an array');
            if (!a.every(i => typeof i === 'string')) throw new DataError('Attributes must be an array of strings');
            return a;
        });
    }
    setAttributes(attributes: string[]) {
        return attemptAsync(async () => {
            attributes = attributes
                .filter(i => typeof i === 'string')
                .filter((v, i, a) => a.indexOf(v) === i);
            return await this.database.update(this.struct.table).set({
                attributes: JSON.stringify(attributes),
                updated: new Date(),
            } as any).where(sql`${this.struct.table.id} = ${this.id}`);
        });
    }
    removeAttributes(...attributes: string[]) {
        return attemptAsync(async () => {
            const a = this.getAttributes().unwrap();
            const newAttributes = a.filter(i => !attributes.includes(i));
            return (await this.setAttributes(newAttributes)).unwrap();
        });
    }
    addAttributes(...attributes: string[]) {
        return attemptAsync(async () => {
            const a = this.getAttributes().unwrap();
            return (await this.setAttributes([...a, ...attributes])).unwrap()
        });
    }

    getUniverses() {
        return attempt(() => {
            const a = JSON.parse(this.data.universes);
            if (!Array.isArray(a)) throw new DataError('Universes must be an array');
            if (!a.every(i => typeof i === 'string')) throw new DataError('Universes must be an array of strings');
            return a;
        });
    }
    setUniverses(universes: string[]) {
        return attemptAsync(async () => {
            universes = universes
                .filter(i => typeof i === 'string')
                .filter((v, i, a) => a.indexOf(v) === i);
            return await this.database.update(this.struct.table).set({
                universes: JSON.stringify(universes),
                updated: new Date(),
            } as any).where(sql`${this.struct.table.id} = ${this.id}`);
        });
    }
    removeUniverses(...universes: string[]) {
        return attemptAsync(async () => {
            const a = this.getUniverses().unwrap();
            const newUniverses = a.filter(i => !universes.includes(i));
            return (await this.setUniverses(newUniverses)).unwrap()
        });
    }
    addUniverses(...universes: string[]) {
        return attemptAsync(async () => {
            const a = this.getUniverses().unwrap();
            return (await this.setUniverses([...a, ...universes])).unwrap()
        });
    }

    safe(omit?: (keyof T & keyof typeof globalCols)[]) {
        const data = { ...this.data };
        if (omit) {
            for (const key of omit) {
                delete data[key];
            }
        }
        return data;
    }
}

type StructEvents<T extends Blank, Name extends string> = {
    update: StructData<T, Name>;
    archive: StructData<T, Name>;
    delete: StructData<T, Name>;
    restore: StructData<T, Name>;
    create: StructData<T, Name>;
    build: void;

    'delete-version': DataVersion<T, Name>;
    'restore-version': DataVersion<T, Name>;
};

type TsType<T extends ColumnDataType> = T extends 'string' ? string : T extends 'number' ? number : T extends 'boolean' ? boolean : T extends 'timestamp' ? Date : never;

export class Struct<T extends Blank, Name extends string> {
    public static async buildAll() {
        return resolveAll(await Promise.all([...Struct.structs.values()].map(s => s.build())));
    }

    public static readonly structs = new Map<string, Struct<Blank, string>>();

    public static handler(event: RequestEvent): Promise<Result<Response>> {
        return attemptAsync(async () => {
            const body: unknown = await event.request.json();

            if (typeof body !== 'object' || body === null) return new Response('Invalid body', { status: 400 });
            if (!Object.hasOwn(body, 'struct')) return new Response('Missing struct', { status: 400 });
            if (!Object.hasOwn(body, 'action')) return new Response('Missing action', { status: 400 });
            if (!Object.hasOwn(body, 'data')) return new Response('Missing data', { status: 400 });

            const B = body as { struct: string; action: DataAction | PropertyAction; data: unknown };

            const struct = Struct.structs.get(B.struct);
            if (!struct) return new Response('Struct not found', { status: 404 });

            const result = (await struct.eventHandler({ action: B.action, data: B.data, request: event })).unwrap();
            if (result) return result;

            return new Response('Not implemented', { status: 501 });
        });
    };

    public static generateLifetimeLoop(time: number) {
        return new Loop(async () => {
            Struct.forEach(async s => {
                s.getLifetimeItems(true).pipe(async d => {
                    if (d.lifetime === 0) return;
                    if (d.created.getTime() + d.lifetime < Date.now()) {
                        (await d.delete()).unwrap();
                    }
                });
            });
        }, time)
    }

    public static forEach(fn: (struct: Struct<Blank, string>) => void) {
        for (const s of Struct.structs.values()) {
            fn(s);
        }
    }
    
    public readonly table: Table<T & typeof globalCols, Name>;
    public readonly versionTable?: Table<T & typeof globalCols & typeof versionGlobalCols, Name>;
    public readonly eventEmitter = new EventEmitter<StructEvents<T, Name>>();

    public on = this.eventEmitter.on.bind(this.eventEmitter);
    public once = this.eventEmitter.once.bind(this.eventEmitter);
    public off = this.eventEmitter.off.bind(this.eventEmitter);
    public emit = this.eventEmitter.emit.bind(this.eventEmitter);

    public loop?: Loop;
    public built = false;

    constructor(public readonly data: StructBuilder<T, Name>) {
        Struct.structs.set(data.name, this as any);

        const snaked = toSnakeCase(fromCamelCase(data.name));

        this.table = pgTable(snaked, {
            ...globalCols,
            ...data.structure,
        }) as any;

        if (data.versionHistory) {
            this.versionTable = pgTable(`${snaked}_history`, {
                ...globalCols,
                ...versionGlobalCols,
                ...data.structure,
            }) as any;
        }
    }

    get database() {
        return this.data.database;
    }

    get name() {
        return this.data.name;
    }

    get sample(): StructData<T, Name> {
        throw new Error('Struct.sample should never be called at runtime, it is only used for testing');
    }

    new(data: Structable<T>) {
        return attemptAsync(async () => {
            const newData: Structable<T & typeof globalCols> = {
                ...data,
                id: uuid(),
                created: new Date(),
                updated: new Date(),
                archived: false,
                universes: '',
                attributes: '',
                lifetime: 0,
            };

            await this.database.insert(this.table).values(newData as any);

            const d = this.Generator(newData);
            this.eventEmitter.emit('create', d);

            return d;
        });
    }

    Generator(data: Structable<T & typeof globalCols>) {
        return new StructData(data, this);
    }

    fromId(id: string) {
        return attemptAsync(async () => {
            const data = await this.database.select().from(this.table).where(sql`${this.table.id} = ${id}`);
            const a = data[0];
            if (!a) return undefined;
            return this.Generator(a as any);
        });
    }

    // TODO: Integrate limits
    all(asStream: true, includeArchived?: boolean): StructStream<T, Name>;
    all(asStream: false, includeArchived?: boolean): Promise<Result<StructData<T, Name>[], Error>>;
    all(asStream: boolean, includeArchived = false){
        const get = () => this.database.select().from(this.table).where(sql`${this.table.archived} = ${includeArchived}`);
        if (asStream) {
            const stream = new StructStream(this);
            (async () => {
                const dataStream = await get();
                for (let i = 0; i < dataStream.length; i++) {
                    stream.add(this.Generator(dataStream[i] as any));
                }
            })();
            return stream;
        } else {
            return attemptAsync(async () => {
                const data = await get();
                return data.map(d => this.Generator(d as any));
            });
        }
    }

    archived(asStream: true): StructStream<T, Name>;
    archived(asStream: false): Promise<Result<StructData<T, Name>[], Error>>;
    archived(asStream: boolean) {
        const get = () => this.database.select().from(this.table).where(sql`${this.table.archived} = ${true}`);
        if (asStream) {
            const stream = new StructStream(this);
            (async () => {
                const dataStream = await get();
                for (let i = 0; i < dataStream.length; i++) {
                    stream.add(this.Generator(dataStream[i] as any));
                }
            })();
            return stream;
        } else {
            return attemptAsync(async () => {
                const data = await get();
                return data.map(d => this.Generator(d as any));
            });
        }
    }

    fromProperty<K extends keyof T>(key: K, value: TsType<T[K]['_']['dataType']>, asStream: true): StructStream<T, Name>;
    fromProperty<K extends keyof T>(key: K, value: TsType<T[K]['_']['dataType']>, asStream: false): Promise<Result<StructData<T, Name>[], Error>>;
    fromProperty<K extends keyof T>(key: K, value: TsType<T[K]['_']['dataType']>, asStream: boolean) {
        const get = () => this.database.select().from(this.table).where(sql`${this.table[key] as any} = ${value}`);
        if (asStream) {
            const stream = new StructStream(this);
            (async () => {
                const dataStream = await get();
                for (let i = 0; i < dataStream.length; i++) {
                    stream.add(this.Generator(dataStream[i] as any));
                }
            })();
            return stream;
        } else {
            return attemptAsync(async () => {
                const data = await get();
                return data.map(d => this.Generator(d as any));
            });
        }
    };

    fromUniverse(universe: string, asStream: true): StructStream<T, Name>;
    fromUniverse(universe: string, asStream: false): Promise<Result<StructData<T, Name>[], Error>>;
    fromUniverse(universe: string, asStream: boolean) {
        const get = () => this.database.select().from(this.table).where(sql`${this.table.universes} LIKE ${`%${universe}%`}`);
        if (asStream) {
            const stream = new StructStream(this);
            (async () => {
                const dataStream = await get();
                for (let i = 0; i < dataStream.length; i++) {
                    stream.add(this.Generator(dataStream[i] as any));
                }
            })();
            return stream;
        } else {
            return attemptAsync(async () => {
                const data = await get();
                return data.map(d => this.Generator(d as any));
            });
        }
    };

    clear() {
        return attemptAsync(async () => {});
    }

    private readonly defaults: Structable<T & typeof globalCols>[] = [];

    addDefaults(...defaults: Structable<T & typeof globalCols>[]) {
        if (this.built) throw new FatalStructError('Cannot add defaults after struct has been built. Those are applied during the build process.');

        this.defaults.push(...defaults);
    }

    getLifetimeItems(asStream: true): StructStream<T, Name>;
    getLifetimeItems(asStream: false): Promise<Result<StructData<T, Name>[], Error>>;
    getLifetimeItems(asStream: boolean) {
        const get = () => this.database.select().from(this.table).where(sql`${this.table.lifetime} > 0`);
        if (asStream) {
            const stream = new StructStream(this);
            (async () => {
                const dataStream = await get();
                for (let i = 0; i < dataStream.length; i++) {
                    stream.add(this.Generator(dataStream[i] as any));
                }
            })();
            return stream;
        } else {
            return attemptAsync(async () => {
                const data = await get();
                return data.map(d => this.Generator(d as any));
            });
        }
    }

    forEach(fn: (data: StructData<T, Name>, i: number) => void) {
        return this.all(true).pipe(fn);
    }

    build() {
        if (this.built) throw new FatalStructError(`Struct ${this.name} has already been built`);
        if (this.data.sample) throw new FatalStructError(`Struct ${this.name} is a sample struct and should never be built`);
        return attemptAsync(async () => {
            const { sse } = await import('./utils/sse');
            const { Session } = await import('./structs/session');
            const { Permissions } = await import('./structs/permissions');

            // Permission handling
            const emitToConnections = async (event: string, data: StructData<T, Name>) => {
                sse.each(async connection => {
                    const session = await connection.getSession();
                    if (session.isErr()) return console.error(session.error);
                    const s = session.value;
                    if (!s) return;

                    const account = await Session.getAccount(s);
                    if (account.isErr()) return console.error(account.error);
                    const a = account.value;
                    if (!a) return;
                    const roles = await Permissions.getRoles(a);
                    if (roles.isErr()) return console.error(roles.error);
                    const r = roles.value;

                    const res = await Permissions.filterAction(r, [data as any], PropertyAction.Read);
                    if (res.isErr()) return console.error(res.error);
                    const [result] = res.value;
                    connection.send(event, result);
                });
            };

            this.on('create', data => {
                emitToConnections('create', data);
            });

            this.on('update', data => {
                emitToConnections('update', data);
            });

            this.on('archive', data => {
                emitToConnections('archive', data);
            });

            this.on('delete', data => {
                emitToConnections('delete', data);
            });

            this.on('restore', data => {
                emitToConnections('restore', data);
            });

            this.emit('build', undefined);

            this.built = true;

            resolveAll(await Promise.all(this.defaults.map(d => {
                return attemptAsync(async () => {
                    const exists = (await this.fromId(d.id)).unwrap();
                    if (exists) return;
                    if (!this.validate(d)) throw new FatalDataError('Invalid default data');
                    this.database.insert(this.table).values(d as any);
                });
            }))).unwrap();
        });
    }

    eventHandler(event: {
        action: DataAction | PropertyAction;
        data: unknown;
        request: RequestEvent;
    }) {
        return attemptAsync<Response>(async () => {
            const { Permissions } = await import('./structs/permissions');
            const { Account } = await import('./structs/account');
            const error = (error: Error) => new Response(error.message, { status: 400 });

            const { Session } = await import('./structs/session');
            const s = (await Session.getSession(event.request)).unwrap();
            if (!s) return error(new StructError('Session not found'));

            const account = (await Session.getAccount(s)).unwrap();
            if (!account) return error(new StructError('Not logged in'));

            const roles = (await Permissions.getRoles(account)).unwrap();

            const invalidPermissions = new Response('Invalid permissions', { status: 403 });

            const isAdmin = !!(await Account.Admins.fromProperty('accountId', account.id, false)).unwrap().length;

            if (event.action === PropertyAction.Read) {
                if (!Object.hasOwn(event.data as any, 'type')) return error(new DataError('Missing Read type'));
                if (!Object.hasOwn(event.data as any, 'args')) return error(new DataError('Missing Read args'));

                let streamer: StructStream<T, Name>;
                const type = (event.data as any).type as 'all' | 'archived' | 'from-id' | 'property' | 'universe';
                switch (type) {
                    case 'all':
                        streamer = this.all(true, false);
                        break;
                    case 'archived':
                        streamer = this.archived(true);
                        break;
                    case 'from-id':
                        if (!Object.hasOwn((event.data as any).args, 'id')) return error(new DataError('Missing Read id'));
                        {
                            const data = (await this.fromId((event.data as any).args.id)).unwrap();
                            if (!data) return error(new DataError('Data not found'));
                            return new Response(JSON.stringify(data.data), { status: 200 });
                        }
                    case 'property':
                        if (!Object.hasOwn((event.data as any).args, 'key')) return error(new DataError('Missing Read key'));
                        if (!Object.hasOwn((event.data as any).args, 'value')) return error(new DataError('Missing Read value'));
                        streamer = this.fromProperty((event.data as any).args.key, (event.data as any).args.value, true);
                        break;
                    case 'universe':
                        if (!Object.hasOwn((event.data as any).args, 'universe')) return error(new DataError('Missing Read universe'));
                        streamer = this.fromUniverse((event.data as any).args.universe, true);
                        break;
                    default:
                        return error(new DataError('Invalid Read type'));
                }

                const readable = new ReadableStream({
                    start(controller) {
                        if (isAdmin) {
                            streamer.pipe(d => controller.enqueue(`data: ${encode(JSON.stringify(d.data))}\n\n`));
                            return;
                        }
                        const stream = Permissions.filterActionPipeline(roles, streamer as any, PropertyAction.Read);
                        stream.pipe(d => controller.enqueue(`data: ${encode(JSON.stringify(d.data))}\n\n`));
                    },
                    cancel() {
                        streamer.off('end');
                        streamer.off('data');
                        streamer.off('error');
                    }
                });

                streamer.on('end', () => {
                    readable.cancel();
                });

                streamer.on('error', e => {
                    readable.cancel();
                    console.error(e);
                });

                return new Response(readable, {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
            }

            if (event.action === DataAction.Create) {
                if (!isAdmin && !Permissions.canDo(roles, this as any, DataAction.Create).unwrap()) return invalidPermissions;
                if (!this.validate(event.data, {
                    optionals: ['id', 'created', 'updated', 'archived', 'universes', 'attributes', 'lifetime'],
                })) return error(new DataError('Invalid data'));

                (await this.new(event.data as any)).unwrap();

                return new Response('Created', { status: 201 });
            }

            if (event.action === PropertyAction.Update) {
                if (!this.validate(event.data, {
                    not: ['created', 'updated', 'archived', 'universes', 'attributes', 'lifetime'],
                    optionals: Object.keys(this.data.structure) as string[],
                })) return error(new DataError('Invalid data'));

                const data = event.data as Structable<T & typeof globalCols>;
                const found = (await this.fromId(data.id)).unwrap();
                if (!found) return error(new DataError('Data not found'));

                if (isAdmin) {
                    await found.update(data);
                } else {
                    const [res] = (await Permissions.filterAction(roles, [found as any], PropertyAction.Update)).unwrap();
                    if (!res) return invalidPermissions;
                    await found.update(Object.fromEntries(Object.entries(data).filter(([k]) => res[k])) as any);
                }

                return new Response('Updated', { status: 200 });
            }

            if (event.action === DataAction.Archive) {
                if (!isAdmin && !Permissions.canDo(roles, this as any, DataAction.Create).unwrap()) return invalidPermissions;
                if (!Object.hasOwn(event.data as any, 'id')) return error(new DataError('Missing id'));

                const data = event.data as Structable<T & typeof globalCols>;
                const found = (await this.fromId(data.id)).unwrap();
                if (!found) return error(new DataError('Data not found'));

                await found.setArchive(true);

                return new Response('Archived', { status: 200 });
            }

            if (event.action === DataAction.Delete) {
                if (!isAdmin && !Permissions.canDo(roles, this as any, DataAction.Create).unwrap()) return invalidPermissions;
                if (!Object.hasOwn(event.data as any, 'id')) return error(new DataError('Missing id'));

                const data = event.data as Structable<T & typeof globalCols>;
                const found = (await this.fromId(data.id)).unwrap();
                if (!found) return error(new DataError('Data not found'));

                await found.delete();

                return new Response('Deleted', { status: 200 });
            }

            if (event.action === DataAction.RestoreArchive) {
                if (!isAdmin && !Permissions.canDo(roles, this as any, DataAction.Create).unwrap()) return invalidPermissions;
                if (!Object.hasOwn(event.data as any, 'id')) return error(new DataError('Missing id'));
                const data = event.data as Structable<T & typeof globalCols>;
                const found = (await this.fromId(data.id)).unwrap();
                if (!found) return error(new DataError('Data not found'));

                await found.setArchive(false);

                return new Response('Restored', { status: 200 });
            }

            return error(new StructError('Invalid action'));
        });
    }

    validate(data: unknown, config?: {
        // if it doesn't have it, ignore
        // if it does, it must be the correct type
        optionals?: string[];
        not?: string[];
    }) {
        if (typeof data !== 'object' || data === null) return false;
        
        const keys = Object.keys(data);

        for (const main in this.data.structure) {
            if (config?.not?.includes(main as any) && keys.includes(main)) return false;
            if (config?.optionals?.includes(main) && !keys.includes(main)) continue;
            if (!keys.includes(main)) return false;
            if (typeof (data as any)[main] !== this.data.structure[main]._.dataType) return false;
        }

        return true;
    }

    hash() {
        return attemptAsync(async () => {
            const data = (await this.all(false)).unwrap()
                .sort((a, b) => a.id.localeCompare(b.id))
                .map(d => JSON.stringify(d.data))
                .join('');

            const encoder = new TextEncoder();
            const buffer = encoder.encode(data);
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        });
    }

    reflect(path: string, body: unknown) {
        const { reflect } = this.data;
        if (!reflect) throw new FatalStructError('Cannot reflect a struct that does not have a reflect config');
        return attemptAsync(async () => {
            const { webhook, headers } = reflect;
            if (!path.startsWith('/')) throw new FatalStructError('Path must start with /');
            const response = await fetch(webhook + path, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) throw new Error('Failed to reflect');

            return response;
        });
    }
}
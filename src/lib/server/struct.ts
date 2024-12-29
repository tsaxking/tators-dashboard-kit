import { pgTable, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import type { PgColumn, PgColumnBuilder, PgColumnBuilderBase, PgTableWithColumns } from 'drizzle-orm/pg-core';
import { sql, type BuildColumns, type ColumnBuilderBase } from 'drizzle-orm';
import { attempt, attemptAsync, resolveAll, type Result } from '$lib/ts-utils/check';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DB } from './db';
import { type ColumnDataType } from 'drizzle-orm';
import { EventEmitter } from '$lib/ts-utils/event-emitter';
import type { Loop } from '$lib/ts-utils/loop';
import { uuid } from './utils/uuid';

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
};

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
    columns: BuildColumns<TableName, T & typeof globalCols, 'pg'>;
    dialect: "pg";
}>;

type Structable<T extends Blank> = {
    [K in keyof T]: TsType<T[K]['_']['dataType']>;
}

export class StructStream<T extends Blank, Name extends string> {
    private readonly emitter = new EventEmitter<{
        data: StructData<T, Name>;
        end: void;
        error: Error;
    }>();

    public on = this.emitter.on.bind(this.emitter);
    public once = this.emitter.once.bind(this.emitter);
    public off = this.emitter.off.bind(this.emitter);
    public emit = this.emitter.emit.bind(this.emitter);

    private index = 0;

    constructor(public readonly struct: Struct<T, Name>) {}

    pipe(fn: (data: StructData<T, Name>, index: number) => void) {
        return attemptAsync(async () => {
            return new Promise<void>((res, rej) => {
                const run = async (data: StructData<T, Name>) => {
                    fn(data, this.index);
                };

                const end = (error?: Error) => {
                    this.off('data', run);
                    if (error) rej(error);
                    else res();
                };

                this.on('data', run);

                this.on('end', () => end());
                this.on('error', end);
            });
        });
    }

    add(data: StructData<T, Name>) {
        this.index++;
        this.emit('data', data);
    }

    end() {
        this.emit('end', undefined);
        this.emitter.destroyEvents();
    }

    await() {
        return attemptAsync(async () => new Promise<StructData<T, Name>[]>((res, rej) => {
            const data: StructData<T, Name>[] = [];
            this.on('data', d => data.push(d));
            this.on('end', () => res(data));
            this.on('error', rej);
        }));
    }
}

export class StructData<T extends Blank, Name extends string> {
    constructor(public readonly data: Structable<T & typeof globalCols>, public readonly struct: Struct<T, Name>) {

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

    update(data: Partial<Structable<T>>) {
        return attemptAsync(async () => {
            const newData = { ...this.data, ...data };
            await this.struct.database.update(this.struct.table).set({
                ...newData as any,
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
            await this.struct.database.delete(this.struct.table).where(sql`${this.struct.table.id} = ${this.id}`);
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
            return await this.struct.database.update(this.struct.table).set({
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
            return await this.struct.database.update(this.struct.table).set({
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
}

type StructEvents<T extends Blank, Name extends string> = {
    update: StructData<T, Name>;
    archive: StructData<T, Name>;
    delete: StructData<T, Name>;
    restore: StructData<T, Name>;
    create: StructData<T, Name>;
    build: void;
};

type TsType<T extends ColumnDataType> = T extends 'string' ? string : T extends 'number' ? number : T extends 'boolean' ? boolean : T extends 'timestamp' ? Date : never;

export class Struct<T extends Blank, Name extends string> {
    public static async buildAll() {
        return resolveAll(await Promise.all([...Struct.structs.values()].map(s => s.build())));
    }

    public static readonly structs = new Map<string, Struct<Blank, string>>();

    public readonly table: Table<T, Name>;
    public readonly eventEmitter = new EventEmitter<StructEvents<T, Name>>();

    public on = this.eventEmitter.on.bind(this.eventEmitter);
    public once = this.eventEmitter.once.bind(this.eventEmitter);
    public off = this.eventEmitter.off.bind(this.eventEmitter);
    public emit = this.eventEmitter.emit.bind(this.eventEmitter);

    public loop?: Loop;
    public built = false;

    constructor(public readonly data: StructBuilder<T, Name>) {
        Struct.structs.set(data.name, this as any);

        this.table = pgTable(data.name, {
            ...globalCols,
            ...data.structure,
        });
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
                id: uuid(),
                created: new Date(),
                updated: new Date(),
                archived: false,
                universes: '',
                attributes: '',
                lifetime: 0,
                ...data,
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
            this.built = true;
        });
    }
}
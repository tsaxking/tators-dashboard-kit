import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import type { PgColumn, PgColumnBuilder, PgColumnBuilderBase, PgTableWithColumns } from 'drizzle-orm/pg-core';
import { sql, type BuildColumns, type ColumnBuilderBase } from 'drizzle-orm';
import { attemptAsync } from '$lib/ts-utils/check';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DB } from './db';
import { type GetSelectTableSelection, type SelectResultField } from 'drizzle-orm/query-builders/select.types';
import { type ColumnDataType } from 'drizzle-orm';

type Blank = Record<string, PgColumnBuilderBase>;

export type StructBuilder<T extends Blank, Name extends string> = {
    database: PostgresJsDatabase;
    name: Name;
    structure: T;
};

const globalCols = {
    id: text('id').primaryKey(),
    created: timestamp<'created', 'string'>('created').defaultNow().notNull(),
    updated: timestamp<'updated', 'string'>('updated').defaultNow().notNull(),
    archived: boolean<'archived'>('archived').default(false).notNull(),
};

type Table<T extends Blank, TableName extends string> = PgTableWithColumns<{
    name: TableName;
    schema: undefined;
    columns: BuildColumns<TableName, T & typeof globalCols, 'pg'>;
    dialect: "pg";
}>;

type ReturnType<T extends Blank> = {
    [K in keyof T]: TsType<T[K]['_']['dataType']>;
}

// type ReturnType<T extends Blank, Name extends string> = { [K in keyof { [Key in keyof GetSelectTableSelection<Table<T, Name>> & string]: SelectResultField<GetSelectTableSelection<Table<T, Name>>[Key], true>; }]: { [Key in keyof GetSelectTableSelection<Table<T, Name>> & string]: SelectResultField<GetSelectTableSelection<Table<T, Name>>[Key], true>; }[K]; }

export class StructData<T extends Blank, Name extends string> {
    constructor(public readonly data: ReturnType<T & typeof globalCols>, public readonly struct: Struct<T, Name>) {

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

    update(data: Partial<ReturnType<T>>) {
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
}

type TsType<T extends ColumnDataType> = T extends 'string' ? string : T extends 'number' ? number : T extends 'boolean' ? boolean : T extends 'timestamp' ? Date : never;

export class Struct<T extends Blank, Name extends string> {
    public static readonly structs = new Map<string, Struct<Blank, string>>();

    public readonly table: Table<T, Name>;

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

    Generator(data: ReturnType<T & typeof globalCols>) {
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

    all(archived = false) {
        return attemptAsync(async () => {
            return (await this.database.select().from(this.table).where(sql`${this.table.archived} = ${archived}`)).map(d => this.Generator(d as any));
        });
    }

    archived() {
        return attemptAsync(async () => {
            return (await this.database.select().from(this.table).where(sql`${this.table.archived} = ${true}`)).map(d => this.Generator(d as any));
        });
    }

    get sample(): StructData<T, Name> {
        throw new Error('Struct.sample should never be called at runtime, it is only used for testing');
    }
}

const s = new Struct({
    name: 'Accounts',
    database: DB,
    structure: {
        username: text('username').notNull(),
        email: text('email').notNull().unique(),
        password: text('password').notNull(),
    }
});

s.fromId('1').then((res) => {
    const d = res.unwrap();
});

const data = s.Generator({
    id: '1',
    created: '2021-01-01T00:00:00.000Z',
    updated: '2021-01-01T00:00:00.000Z',
    username: 'test',
    email: 'test',
    password: 'test',
    archived: false,
});
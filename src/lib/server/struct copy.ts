import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import type { PgColumn, PgColumnBuilder, PgColumnBuilderBase, PgTableWithColumns } from 'drizzle-orm/pg-core';
import { sql, type BuildColumns, type ColumnBuilderBase } from 'drizzle-orm';
import { attemptAsync } from '$lib/ts-utils/check';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DB } from './db';

type SQL_Type = 'text' | 'integer' | 'timestamp' | 'boolean';

type Blank = Record<string, TypeConfig>;

type TypeConfig = {
    name: string;
    dataType: SQL_Type;
    notNull?: boolean;
    unique?: boolean;
    primaryKey?: boolean;
};

type Return<T extends SQL_Type> = T extends 'text' ? string : T extends 'integer' ? number : T extends 'timestamp' ? string : T extends 'boolean' ? boolean : never;

type MyReturnType<T extends Record<string, TypeConfig>> = {
    [K in keyof T]: Return<T[K]['dataType']>;
}

type ConfigToPg<T extends TypeConfig> = {};

type PgTableBuilder<T extends Blank, Name extends string> = PgTableWithColumns<{
    name: Name;
    schema: undefined;
    dialect: 'pg';
    // columns: 
}>;

export type StructBuilder<T extends Blank, Name extends string> = {
    database: PostgresJsDatabase;
    name: Name;
    structure: T;
};

type ReturnType<T extends Blank> = {
    [K in keyof T]: T[K] extends PgColumnBuilderBase<infer C> ? C['data'] : never;
}

export class StructData<T extends Blank, Name extends string> {
    constructor(public readonly data: ReturnType<T>, public readonly struct: Struct<T, Name>) {

    }
}

export class Struct<T extends Blank, Name extends string> {
    public static readonly structs = new Map<string, Struct<Blank, string>>();

    constructor(public readonly data: StructBuilder<T, Name>) {
        Struct.structs.set(data.name, this as any);
    }

    get database() {
        return this.data.database;
    }
}
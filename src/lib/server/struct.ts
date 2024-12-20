import { attemptAsync } from '$lib/utils/check';
import { EventEmitter } from '$lib/utils/event-emitter';
import type {  GlobalCols, TS_Type, SQL_Type } from '$lib/utils/struct';
import { pgTable, text, integer, timestamp, boolean, bigint, real } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { PgColumn, PgTableWithColumns } from 'drizzle-orm/pg-core';
import { eq, Column } from 'drizzle-orm';

type Blank = Record<string, PgColumn>;

type Table<Cols extends Record<string, PgColumn>> = PgTableWithColumns<{
    name: string;
    schema: string | undefined;
    dialect: 'pg';
    columns: Cols;
}>;

export type StructBuilder<T extends Blank> = {
    database: PostgresJsDatabase;
    name: string;
    structure: Table<T>;
};

export class Struct<T extends Blank> {
    public static readonly structs = new Map<string, Struct<Blank>>();


    private readonly emitter = new EventEmitter<{

    }>();

    constructor(public readonly data: StructBuilder<T>) {
        Struct.structs.set(data.name, this);
    }

    table() {
        return pgTable(this.data.name, Object.fromEntries(Object.entries(this.data.structure).map(([key, value]) => [key, generateCol(value, key)])));
    }

    fromId(id: string) {
        return attemptAsync(async () => {
            const t = this.table();
            const data = await this.data.database.select().from(t).where(eq(t.id, id));
            return data[0];
        });
    }
}
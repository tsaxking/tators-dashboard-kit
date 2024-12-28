import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import type { PgColumnBuilderBase, PgTableWithColumns } from 'drizzle-orm/pg-core';
import { type BuildColumns } from 'drizzle-orm';
import { attemptAsync } from '$lib/utils/check';

type Blank = Record<string, PgColumnBuilderBase>;

export type StructBuilder<T extends Blank, Name extends string> = {
    name: Name;
    structure: T;
};

const globalCols = {
    id: text('id').primaryKey(),
    created: timestamp('created').defaultNow().notNull(),
    updated: timestamp('updated').defaultNow().notNull(),
    archived: boolean('archived').default(false).notNull(),
};

type Table<T extends Blank, TableName extends string> = PgTableWithColumns<{
    name: TableName;
    schema: undefined;
    columns: BuildColumns<TableName, T, 'pg'>;
    dialect: "pg";
}>;

export class Struct<T extends Blank, Name extends string> {
    public static readonly structs = new Map<string, Struct<Blank, string>>();

    public readonly table: Table<T & typeof globalCols, Name>;

    constructor(public readonly data: StructBuilder<T, Name>) {
        Struct.structs.set(data.name, this as any);

        this.table = pgTable(data.name, {
            ...globalCols,
            ...data.structure,
        });
    }

    fromId(id: string) {
        return attemptAsync(async () => {});
    }
}

const s = new Struct({
    name: 'Accounts',
    // database: null,
    structure: {
        username: text('username').notNull(),
        email: text('email').notNull().unique(),
        password: text('password').notNull(),
    }
});

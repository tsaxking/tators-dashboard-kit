import type { SQL_Type, TS_Type } from '$lib/utils/struct';
import { pgTable, text, integer, timestamp, boolean, type PgTableWithColumns, PgColumn, serial } from 'drizzle-orm/pg-core';

type a = PgTableWithColumns<{
	name: "account";
    schema: undefined;
    columns: {
        id: PgColumn<{
			name: "id";
			tableName: "account";
			dataType: "string";
			columnType: "PgText";
			data: string;
			driverParam: string;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: true;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;

type DataType<T extends SQL_Type> = T extends 'text' ? 'string' : T extends 'integer' ? 'number' : T extends 'boolean' ? 'boolean' : never;
type PgType<T extends SQL_Type> = T extends 'text' ? 'PgText' : T extends 'integer' ? 'PgInteger' : T extends 'boolean' ? 'PgBoolean' : never;

type Col<TableName extends string, Type extends SQL_Type> = PgColumn<{
	name: "id";
	tableName: "account";
	dataType: "string";
	columnType: "PgText";
	data: string;
	driverParam: string;
	notNull: true;
	hasDefault: false;
	isPrimaryKey: true;
	isAutoincrement: false;
	hasRuntimeDefault: false;
	enumValues: [string, ...string[]];
	baseColumn: never;
	generated: undefined;
}, {}, {}>;


type Table<Name extends string, Cols extends Record<string, SQL_Type>> = PgTableWithColumns<{
	name: Name;
	schema: undefined;
	columns: Record<string, Col<Name, Cols[string]>>;
	dialect: 'pg';
}>;

export const account: a = pgTable('account', {
	id: text('id').primaryKey(),
	// created: text('created').notNull(),
	// updated: text('updated').notNull(),
	// archived: boolean('archived').notNull(),
	// attributes: text('attributes').notNull(),
	// universes: text('universes').notNull(),
	// lifetime: integer('lifetime').notNull(),

	// username: text('username').notNull().unique(),
	// firstName: text('first_name').notNull(),
	// lastName: text('last_name').notNull(),
	// email: text('email').notNull().unique(),
	// key: text('key').notNull(),
	// salt: text('salt').notNull(),
	// picture: text('picture').notNull(),
	// verified: boolean('verified').notNull(),
	// verification: text('verification').notNull(),
});

const col = serial('id');

export const session = pgTable('session', {
	id: integer('id').primaryKey(),
	created: text('created').notNull(),
	updated: text('updated').notNull(),
	archived: boolean('archived').notNull(),
	attributes: text('attributes').notNull(),
	universes: text('universes').notNull(),
	lifetime: integer('lifetime').notNull(),

	accountId: text('account_id').notNull(),
	ip: text('ip').notNull(),
	userAgent: text('user_agent').notNull(),
	requests: integer('requests').notNull(),
	prevUrl: text('prev_url').notNull(),
});

session.id

export type Session = typeof session.$inferSelect;

export type Account = typeof account.$inferSelect;


// import { serial, timestamp, boolean } from 'drizzle-orm/pg-core';

// export const commonColumns = {
//     id: serial('id').primaryKey(),
//     created: timestamp('created').defaultNow().notNull(),
//     updated: timestamp('updated').defaultNow().notNull(),
//     archived: boolean('archived').default(false).notNull(),
// };

// // Define tables manually by spreading common columns
// import { varchar, pgTable } from 'drizzle-orm/pg-core';

// export const usersTable = pgTable('users', {
//     ...commonColumns,
//     username: varchar('username', { length: 255 }).notNull(),
//     email: varchar('email', { length: 255 }).unique().notNull(),
// });

// usersTable.id;
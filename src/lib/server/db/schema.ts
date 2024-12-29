import type { SQL_Type, TS_Type } from '$lib/utils/struct';
import { pgTable, text, integer, timestamp, boolean, type PgTableWithColumns, PgColumn, serial } from 'drizzle-orm/pg-core';
import { DB } from '.';
import { eq } from 'drizzle-orm';


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

DB.select().from(session).where(eq(session.id, 1));
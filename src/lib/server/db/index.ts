import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
const client = postgres(env.DATABASE_URL);
export const db = drizzle(client);
import { pgTable, text } from 'drizzle-orm/pg-core';
import { type PgColumnBuilderBase, type AnyPgColumn } from 'drizzle-orm/pg-core';

type Colmap = Record<string, PgColumnBuilderBase>;

const obj: Colmap = {
    id: text('id').primaryKey(),
};

const table = pgTable('account', obj);

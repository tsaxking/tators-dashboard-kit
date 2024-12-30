import { boolean, text } from "drizzle-orm/pg-core";
import { DB } from "../db";
import { Struct } from "../struct";
import { uuid } from "../utils/uuid";

export namespace Account {
    export const Account = new Struct({
        database: DB,
        name: 'Account',
        structure: {
            username: text('username').notNull().unique(),
            key: text('key').notNull().unique(),
            salt: text('salt').notNull(),
            firstName: text('first_name').notNull(),
            lastName: text('last_name').notNull(),
            email: text('email').notNull().unique(),
            picture: text('picture').notNull(),
            verified: boolean('verified').notNull(),
            verification: text('verification').notNull(),
        },
        generators: {
            id: () => (uuid() + uuid() + uuid() + uuid()).replace(/-/g, ''),
        }
    });

    Account.bypass('*', (a, b) => a.id === b?.id);

    Account.on('delete', async (a) => {
        Admins.fromProperty('accountId', a.id, true).pipe(a => a.delete());
    });

    export const Admins = new Struct({
        database: DB,
        name: 'Admins',
        structure: {
            accountId: text('account_id').notNull().unique(),
        },
    });
    
    export type AccountData = typeof Account.sample;
}
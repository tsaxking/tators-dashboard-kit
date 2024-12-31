import { boolean, text } from "drizzle-orm/pg-core";
import { Struct } from "../struct";
import { uuid } from "../utils/uuid";

export namespace Account {
    export const Account = new Struct({
        name: 'account',
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
        name: 'admins',
        structure: {
            accountId: text('account_id').notNull().unique(),
        },
    });
    
    export type AccountData = typeof Account.sample;
}

// for drizzle
export const _accountTable = Account.Account.table;
export const _adminsTable = Account.Admins.table;
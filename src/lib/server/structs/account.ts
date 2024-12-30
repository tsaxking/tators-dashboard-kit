import { text } from "drizzle-orm/pg-core";
import { DB } from "../db";
import { Struct } from "../struct";
import { uuid } from "../utils/uuid";

export namespace Account {
    export const Account = new Struct({
        database: DB,
        name: 'Account',
        structure: {
            
        },
        generators: {
            id: () => (uuid() + uuid() + uuid() + uuid()).replace(/-/g, ''),
        }
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
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
    
    export type AccountData = typeof Account.sample;
}
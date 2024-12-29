import { DB } from "../db";
import { Struct } from "../struct";

export namespace Account {
    export const Account = new Struct({
        database: DB,
        name: 'Account',
        structure: {
            
        }
    });


    const test = async () => {
    };
}
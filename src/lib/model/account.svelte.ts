import { attemptAsync } from "ts-utils/dist/check";
import { sse } from "$lib/utils/sse";
import { Struct, type Structable } from "drizzle-struct/src/front-end"

export namespace Account {
    export const Account = new Struct({
        name: 'account',
        structure: {},
        socket: sse
    });

    export type AccountData = Structable<typeof Account.data.structure>;
    
    export const self: AccountData = $state({

    });

    export const getSelf = async () => {
        return attemptAsync(async () => {});
    };


    getSelf();
}
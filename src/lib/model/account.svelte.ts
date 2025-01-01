import { attemptAsync } from "$lib/ts-utils/check";
import { sse } from "$lib/utils/sse";
import { Struct, type Structable } from "./struct"

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
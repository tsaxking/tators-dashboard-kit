import { sse } from "$lib/utils/sse";
import { Struct, StructData } from "drizzle-struct/front-end";

export namespace Universes {
    export const Universe = new Struct({
        name: 'universe',
        socket: sse,
        structure: {
            name: 'string',
            description: 'string',
            public: 'boolean',
        }
    });

    export type UniverseData = StructData<typeof Universe.data.structure>;

    export const UniverseInvite = new Struct({
        name: 'universe_invite',
        socket: sse,
        structure: {
            universe: 'string',
            account: 'string',
            inviter: 'string',
        },
    });

    export type UniverseInviteData = StructData<typeof UniverseInvite.data.structure>;
}
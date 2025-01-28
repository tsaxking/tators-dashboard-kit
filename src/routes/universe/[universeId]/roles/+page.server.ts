import { Universes } from '$lib/server/structs/universe.js';
import { fail, redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
    const { universeId } = event.params;

    const universe = await Universes.Universe.fromId(universeId);
    if (universe.isErr()) {
        console.error(universe.error);
        throw fail(ServerCode.internalServerError);
    }

    if (!universe.value) throw redirect(ServerCode.permanentRedirect, '/404');

    return {
        universe: universe.value.safe()
    };
};

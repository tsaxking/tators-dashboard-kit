import { Universes } from '$lib/model/universe.js';

export const load = (event) => {
    return {
        invite: Universes.UniverseInvite.Generator(event.data.invite),
        universe: Universes.Universe.Generator(event.data.universe),
    }
};
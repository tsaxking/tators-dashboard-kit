import { Universes } from '$lib/model/universe.js';

export const load = (event) => {
    return {
        universes: event.data.universes.map(u => Universes.Universe.Generator(u)),
        current: event.data.current ? Universes.Universe.Generator(event.data.current) : null,
    }
};
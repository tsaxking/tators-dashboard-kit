import { Universes } from '$lib/model/universe.js';
import { fail, redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const load = (event) => {
    const universe = event.data.universe;
    return {
        universe: Universes.Universe.Generator(universe),
    };
};

import { Account } from '$lib/model/account.js';
import { Universes } from '$lib/model/universe.js';

export const load = (event) => {
	return {
		universe: Universes.Universe.Generator(event.data.universe)
	};
};

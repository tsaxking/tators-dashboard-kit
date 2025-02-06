import * as TBA from '$lib/server/utils/tba';
import { redirect, fail } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const load = async (req) => {
	const event = await TBA.Event.getEvent(req.params.eventKey);
	if (event.isErr()) {
		throw redirect(ServerCode.temporaryRedirect, '/404');
	}

	const [teams, matches] = await Promise.all([event.value.getTeams(), event.value.getMatches()]);

	if (teams.isErr()) throw fail(ServerCode.internalServerError);
	if (matches.isErr()) throw fail(ServerCode.internalServerError);

	return {
		event: event.value.tba,
		teams: teams.value.map((t) => t.tba),
		matches: matches.value.map((m) => m.tba)
	};
};

import { FIRST } from '$lib/server/structs/FIRST.js';
import { Scouting } from '$lib/server/structs/scouting.js';
import { and, eq } from 'drizzle-orm';
import * as TBA from '$lib/server/utils/tba';
import { fail } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
    const eventKey = event.params.eventKey;
    const number = parseInt(event.params.number);

    const e = await TBA.Event.getEvent(eventKey);
    if (e.isErr()) {
        throw fail(ServerCode.notFound, {
            message: 'Event not found',
        });
    }
    const teams = await e.value.getTeams();
    if (teams.isErr()) {
        throw fail(
            ServerCode.internalServerError,
            {
                message: 'Failed to get teams',
            }
        );
    }

    const team = teams.value.find(t => t.tba.team_number === number);
    if (!team) {
        throw fail(ServerCode.notFound, {
            message: 'Team not found',
        });
    }

    return {
        event: e,
        team
    }
};
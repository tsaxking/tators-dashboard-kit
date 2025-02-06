import { Event } from '$lib/server/utils/tba';
import { fail } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';


export const load = async (req) => {
    const year = parseInt(req.params.year);
    const events = await Event.getEvents(year);
    if (events.isErr()) {
        console.error(events.error);
        throw fail(ServerCode.internalServerError);
    }
    return {
        events: events.value.map(e => e.tba),
    }
};
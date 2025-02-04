import * as TBA from '$lib/server/utils/tba';
import { z } from 'zod';
import { ServerCode } from 'ts-utils/status';
import { Session } from '$lib/server/structs/session';
import { Permissions } from '$lib/server/structs/permissions';

export const GET = async (event) => {
    const year = parseInt(event.params.year);

    const e = await TBA.Event.getEvents(year);

    if (e.isErr()) {
        console.error(e.error);
        return new Response(
            'Server Error',
            {
                status: 500
            }
        );
    }

    return new Response(
        JSON.stringify(e.value.map(evt => evt.tba)),
        {
            headers: {
                'Content-Type': 'application/json'
            },
            status: 200,
        }
    );
};



export const POST = async (event) => {
    const session = await Session.getSession(event);
    if (session.isErr()) {
        console.error(session.error);
        return new Response(
            'Server Error',
            {
                status: 500
            }
        );
    }

    const account = await Session.getAccount(session.value);
    if (account.isErr()) {
        console.error(account.error);
        return new Response(
            'Server Error',
            {
                status: 500
            }
        );
    }

    const roles = await Permissions.getRolesFromAccount(account.value);

    const isPermitted = await Permissions.isEntitled(account.value, 'create-custom-tba-responses');
    if (isPermitted.isErr()) {
        console.error(isPermitted.error);
        return new Response(
            'Server Error',
            {
                status: 500
            }
        );
    }

    if (!isPermitted.value) {
        return new Response(
            'Unauthorized',
            {
                status: ServerCode.unauthorized,
            }
        );
    }

    const body = z.object({
        key: z.string(),
        name: z.string(),
        startDate: z.string().date(),
        endDate: z.string().date(),
        year: z.number().int().min(2000).max(2100),
    }).safeParse(await event.request.json());

    if (body.error) {
        return new Response(
            'Invalid Request',
            {
                status: ServerCode.badRequest,
            }
        );
    }

    const e = await TBA.Event.createEvent({
        ...body.data,
        startDate: new Date(body.data.startDate),
        endDate: new Date(body.data.endDate),
    });

    if (e.isErr()) {
        console.error(e.error);
        return new Response(
            'Server Error',
            {
                status: 500
            }
        );
    }

    return new Response(
        'Created',
        {
            status: 201,
        }
    )
};
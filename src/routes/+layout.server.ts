import '$lib/server/index';
import { Session } from '$lib/server/structs/session.js';
import { config } from 'dotenv';
import { uuid } from '$lib/server/utils/uuid.js';
config();


export const load = async (event) => {
    const session = await Session.getSession(event);
    if (session.isErr()) {
        return {
            status: 500,
            error: 'Failed to get session',
        };
    }

    // event.cookies.set('test', uuid(), {
    //     httpOnly: true,
    //     domain: process.env.DOMAIN ?? '',
    //     // sameSite: 'none',
    //     path: '/',
    //     // expires: new Date(Date.now() + parseInt(process.env.SESSION_DURATION ?? '0'))
    // });
};

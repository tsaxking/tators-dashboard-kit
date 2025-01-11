import { Session } from '$lib/server/structs/session.js';
import { Universes } from '$lib/server/structs/universe.js';
import { fail } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
    const session = await Session.getSession(event);
    if (session.isErr()) throw fail(ServerCode.internalServerError);
    const account = await Session.getAccount(session.value);
    if (account.isErr()) throw fail(ServerCode.internalServerError);
    if (!account.value) throw fail(ServerCode.unauthorized);

    const universes = await Universes.getUniverses(account.value);
    if (universes.isErr()) throw fail(ServerCode.internalServerError);

    const currentUniverse = await Universes.Universe.fromId(session.value.getUniverses().unwrap()[0] || '');
    if (currentUniverse.isErr()) throw fail(ServerCode.internalServerError);

    return {
        universes: universes.value.map(u => u.safe()),
        current: currentUniverse.value?.safe(),
    }
};
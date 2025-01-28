import { Universes } from '$lib/server/structs/universe.js'
import { fail, redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
    const invite = await Universes.UniverseInvites.fromId(event.params.inviteId);
    if (invite.isErr()) {
        throw fail(ServerCode.internalServerError);
    }

    if (!invite.value) throw redirect(ServerCode.permanentRedirect, '/404');

    const universe = await Universes.Universe.fromId(invite.value.data.universe);

    if (universe.isErr()) {
        throw fail(ServerCode.internalServerError);
    }

    if (!universe.value) throw redirect(ServerCode.permanentRedirect, '/404');

    return {
        invite: invite.value.safe(),
        universe: universe.value.safe(),
    };
}


export const actions = {
    accept: async (event) => {
        const invite = await Universes.UniverseInvites.fromId(event.params.inviteId);
        if (invite.isErr()) {
            throw fail(ServerCode.internalServerError);
        }

        if (invite.value) {
            const res = await Universes.acceptInvite(invite.value);
            if (res.isErr()) {
                throw fail(ServerCode.internalServerError);
            }

            await invite.value.delete();
        } else {
            throw redirect(ServerCode.permanentRedirect, '/404');
        }
    },
    decline: async (event) => {
        const invite = await Universes.UniverseInvites.fromId(event.params.inviteId);
        if (invite.isErr()) {
            throw fail(ServerCode.internalServerError);
        }

        if (invite.value) {
            await invite.value.delete();
        }

        return redirect(ServerCode.permanentRedirect, '/universe');
    },
}
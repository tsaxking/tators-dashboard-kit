import { redirect, fail } from '@sveltejs/kit';
import { Email } from '$lib/server/structs/email';
import { ServerCode } from 'ts-utils/status';

export const GET = async (event) => {
    const link = await Email.Links.fromId(event.params.linkId);
    if (link.isErr()) {
        throw fail(
            ServerCode.internalServerError,
        );
    }

    if (!link.value) {
        throw redirect(
            ServerCode.permanentRedirect,
            '/404',
        )
    }

    if (link.value.data.expires !== 'never' && new Date(link.value.data.expires) < new Date()) {
        throw fail(
            ServerCode.unauthorized,
        );
    }

    if (!link.value.data.opened) {
        await link.value.update({
            opened: true,
        });
    }

    throw redirect(
        ServerCode.permanentRedirect,
        link.value.data.link,
    );
}
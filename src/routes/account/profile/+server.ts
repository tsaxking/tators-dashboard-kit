import { Session } from '$lib/server/structs/session.js';
import { FileReceiver } from '$lib/server/utils/files';
import { error } from '@sveltejs/kit';


export const POST = async (event) => {
    const session = await Session.getSession(event);
    if (session.isErr()) {
        console.error(session.error);
        return error(500, 'Failed to get session');
    }

    const account = await Session.getAccount(session.value);

    if (account.isErr()) {
        console.error(account.error);
        return error(500, 'Failed to get account');
    }

    if (!account.value) {
        return error(401, 'Unauthorized');
    }

    const fr = new FileReceiver({
        maxFileSize: 1024 * 1024 * 10, // 10MB
        maxFiles: 1,
    });

    const res = await fr.receive(event);

    if (res.isErr()) {
        console.error(res.error);
        return error(500, 'Failed to receive file');
    }

    account.value.update({
        picture: res.value.files[0].filePath,
    })
};
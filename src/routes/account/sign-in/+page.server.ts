import { fail, json } from '@sveltejs/kit';
import { Account } from '$lib/server/structs/account.js';
import { Session } from '$lib/server/structs/session.js';
import type { Result } from 'ts-utils/check';
import { ServerCode } from 'ts-utils/status';
import { z } from 'zod';

export const actions = {
    login: async (event) => {
        const data = await event.request.formData();
        const res = z.object({
            username: z.string(),
            password: z.string(),
        }).safeParse({
            username: data.get('user'),
            password: data.get('password'),
        });
        if (!res.success) {
            return fail(ServerCode.badRequest, {
                message: 'Invalid form data',
                user: data.get('user'),
                success: false,
                redirect: false
            });
        }

        let account: Result<Account.AccountData | undefined>;

        account = await Account.Account.get({
            username: res.data.username,
        }, false);

        if (!account) {
            account = await Account.Account.get({
                email: res.data.username,
            }, false);
        }

        if (account.isErr()) {
            return fail(ServerCode.notFound, {
                user: res.data.username,
                message: 'Account not found',
                success: false,
                redirect: false
            });
        }

        const session = await Session.getSession(event);
        if (session.isErr()) {
            return fail(ServerCode.internalServerError, {
                user: res.data.username,
                message: 'Failed to get session',
                success: false,
                redirect: false
            });
        }

        session.value.update({
            accountId: account.value?.id,
        });

        return json({
            message: 'Logged in',
            success: true,
            redirect: session.value.data.prevUrl || '/',
        });
    },
};
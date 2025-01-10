import { fail, json, redirect } from '@sveltejs/kit';
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
            });
        }

        let account: Account.AccountData;

        ACCOUNT: {
            const user = await Account.Account.fromProperty('username', res.data.username, false);
            if (user.isErr()) {
                return fail(ServerCode.internalServerError, {
                    user: res.data.username,
                    message: 'Failed to get user',
                });
            }
            [account] = user.value;
            if (account) break ACCOUNT;

            const email = await Account.Account.fromProperty('email', res.data.username, false);
            if (email.isErr()) {
                return fail(ServerCode.internalServerError, {
                    user: res.data.username,
                    message: 'Failed to get user',
                });
            }
            [account] = email.value;
            if (account) break ACCOUNT;

            return fail(ServerCode.notFound, {
                user: res.data.username,
                message: 'User not found',
            });
        }

        const session = await Session.getSession(event);
        if (session.isErr()) {
            return fail(ServerCode.internalServerError, {
                user: res.data.username,
                message: 'Failed to get session',
            });
        }

        const sessionRes = await session.value.update({
            accountId: account.id,
        });

        if (sessionRes.isErr()) {
            console.error(sessionRes.error);
            return fail(ServerCode.internalServerError, {
                user: res.data.username,
                message: 'Failed to update session',
            });
        }

        return {
            message: 'Logged in',
            user: res.data.username,
            redirect: session.value.data.prevUrl || '/',
            success: true,
        }
    },
};
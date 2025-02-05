import { Session } from '$lib/server/structs/session.js';
import { config } from 'dotenv';
import { Struct } from 'drizzle-struct/back-end';
import { Account } from '$lib/server/structs/account';
import '$lib/server/structs/permissions';
import '$lib/server/structs/universe';
import { DB } from '$lib/server/db/';
import { handleEvent, connectionEmitter } from '$lib/server/event-handler';
import '$lib/server/utils/files';
import { env } from '$env/dynamic/private';
config();

Struct.each((struct) => {
	if (!struct.built) {
		struct.build(DB);
		struct.eventHandler(handleEvent(struct));
		connectionEmitter(struct);
	}
});

// Struct.setupLogger(path.join(process.cwd(), 'logs', 'structs'));

export const load = async (event) => {
	const session = await Session.getSession(event);
	if (session.isErr()) {
		return {
			status: 500,
			error: 'Failed to get session'
		};
	}

	if (env.AUTO_SIGN_IN) {
		const account = await Account.Account.fromId(env.AUTO_SIGN_IN);
		if (account.isOk() && account.value) {
			const res = await Session.signIn(account.value, session.value);
			if (res.isErr()) {
				return {
					status: 500,
					error: 'Failed to sign in'
				};
			}
		}
	}

	if (![
		'/account/sign-in',
		'/account/sign-up',
	].includes(event.url.pathname) && 
	!event.url.pathname.includes('/account/password-reset') &&
	!event.url.pathname.includes('/status')
) {
		session.value.update({
			prevUrl: event.url.pathname,
			requests: session.value.data.requests + 1
		});
	} else {
		session.value.update({
			requests: session.value.data.requests + 1
		});
	}
};

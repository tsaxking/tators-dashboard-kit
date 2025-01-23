import { Account } from '$lib/server/structs/account';
import { Session } from '$lib/server/structs/session.js';

export const GET = async (event) => {
	const s = await Session.getSession(event);
	if (s.isErr()) return new Response('Unable to read session', { status: 500 });
	const a = await Session.getAccount(s.value);
	if (a.isErr()) return new Response('Unable to read account', { status: 500 });
	if (!a.value) return new Response('Not logged in', { status: 401 });
	const notifs = await Account.AccountNotification.fromProperty('accountId', a.value.id, {
		type: 'array',
		limit: parseInt(event.params.limit),
		offset: parseInt(event.params.offset)
	});
	if (notifs.isErr()) return new Response('Unable to read notifications', { status: 500 });

	return new Response(JSON.stringify(notifs.value), { status: 200 });
};

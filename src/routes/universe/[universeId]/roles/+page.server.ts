import { Universes } from '$lib/server/structs/universe.js';
import { fail, redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';
import { Session } from '$lib/server/structs/session.js';
import { Permissions } from '$lib/server/structs/permissions.js';

export const load = async (event) => {
	const session = await Session.getSession(event);
	if (session.isErr()) {
		console.error(session.error);
		throw fail(ServerCode.internalServerError);
	}

	const account = await Session.getAccount(session.value);
	if (account.isErr()) {
		console.error(account.error);
		throw fail(ServerCode.internalServerError);
	}

	if (!account.value) throw redirect(ServerCode.permanentRedirect, '/404');

	const { universeId } = event.params;

	const universe = await Universes.Universe.fromId(universeId);
	if (universe.isErr()) {
		console.error(universe.error);
		throw fail(ServerCode.internalServerError);
	}

	if (!universe.value) throw redirect(ServerCode.permanentRedirect, '/404');

	const roles = await Universes.memberRoles(account.value, universe.value);
	if (roles.isErr()) {
		console.error(roles.error);
		throw fail(ServerCode.internalServerError);
	}

	if (!Permissions.canAccess(roles.value, 'roles')) {
		throw redirect(ServerCode.permanentRedirect, '/404');
	}

	return {
		universe: universe.value.safe()
	};
};

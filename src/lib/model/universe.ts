import { sse } from '$lib/utils/sse';
import { Struct, StructData } from 'drizzle-struct/front-end';
import { attemptAsync } from 'ts-utils/check';
import { Account } from './account';

export namespace Universes {
	export const Universe = new Struct({
		name: 'universe',
		socket: sse,
		structure: {
			name: 'string',
			description: 'string',
			public: 'boolean'
		}
	});

	export type UniverseData = StructData<typeof Universe.data.structure>;

	export const UniverseInvite = new Struct({
		name: 'universe_invite',
		socket: sse,
		structure: {
			universe: 'string',
			account: 'string',
			inviter: 'string'
		}
	});

	export type UniverseInviteData = StructData<typeof UniverseInvite.data.structure>;

	export const acceptInvite = async (invite: UniverseInviteData) => {
		return attemptAsync(async () => {});
	};

	export const declineInvite = async (invite: UniverseInviteData) => {
		return attemptAsync(async () => {});
	};

	export const getMembers = (universe: UniverseData) => {
		return Account.Account.query('universe-members', {
			universe: universe.data.id,
		}, {
			asStream: false,
			satisfies: _ => false, // no auto update but it's fine 😢
		});
	};

	export const setUniverse = (universe: string) => {
		Struct.headers.set('universe', universe);
	};
}

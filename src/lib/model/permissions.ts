import { type Writable, writable } from 'svelte/store';
import { attempt, attemptAsync } from 'ts-utils/check';
// import { Requests } from '../utils/requests';
import { Account } from './account';
import { Struct, StructData } from 'drizzle-struct/front-end';
import { type Blank } from 'drizzle-struct/front-end';
import { sse } from '$lib/utils/sse';
import type { DataAction, PropertyAction } from 'drizzle-struct/types';
import { browser } from '$app/environment';
import { Requests } from '$lib/utils/requests';

export namespace Permissions {
	export const Role = new Struct({
		name: 'role',
		socket: sse,
		structure: {
			name: 'string',
			// universe: 'string',
			entitlements: 'string', // string[]
			description: 'string',
			links: 'string' // used on the front end to show/hide links (csv)
		},
		browser
		// log: true,
	});

	if (browser) Object.assign(window, { Role });

	export type RoleData = StructData<typeof Role.data.structure>;

	export const getEntitlements = () => {
		return Requests.get<
			{
				name: string;
				struct: string;
			}[]
		>('/struct/entitlements', {
			expectStream: false,
			cache: true
		});
	};

	export const saveEntitlements = async (role: RoleData, permissions: string[]) => {
		return Role.call('update-entitlements', {
			role: role.data.id,
			permissions
		});
	};

	export const usersFromRole = (role: RoleData) => {
		return Account.Account.query(
			'role-members',
			{
				role: role.data.id
			},
			{
				asStream: false,
				satisfies: (_) => false
			}
		);
	};
}

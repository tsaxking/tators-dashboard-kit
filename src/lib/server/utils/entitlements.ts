import { attemptAsync, resolveAll, attempt } from 'ts-utils/check';
import YAML from 'yaml';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { Struct, type Blank } from 'drizzle-struct/back-end';
import { DataAction, PropertyAction } from 'drizzle-struct/types';
import type { GlobalCols } from 'drizzle-struct/front-end';
import type { Entitlement } from '$lib/types/entitlements';

const ENTITLEMENT_DIR = path.join(process.cwd(), 'private', 'entitlements');
const ENTITLEMENT_FILE = path.join(process.cwd(), 'src', 'lib', 'types', 'entitlements.ts');

export const getEntitlementNames = async () => {
	return attemptAsync(async () => {
		return (await fs.promises.readdir(ENTITLEMENT_DIR))
			.filter((f) => f.endsWith('.yaml') && !f.includes('example'))
			.map((f) => f.replace('.yaml', ''));
	});
};

export const getEntitlements = async () => {
	return attemptAsync(async () => {
		return resolveAll(
			await Promise.all(
				(await getEntitlementNames()).unwrap().map((e) => readEntitlement(e as Entitlement))
			)
		).unwrap();
	});
};

export class EntitlementPermission {
	public readonly permissions: { action: string; property: string }[];
	constructor(
		public readonly name: Entitlement,
		public readonly struct: string,
		permissions: string[],
		public readonly pages: string[]
	) {
		this.permissions = permissions.map((p) => {
			if (p === '*') return { action: '*', property: '*' };
			const [action, property] = p.split(':');
			return { action, property };
		});
	}

	_saved = Date.now();
}

const entitlements = new Map<string, EntitlementPermission>();

setInterval(() => {
	const now = Date.now();
	for (const [key, value] of entitlements) {
		if (now - value._saved > 1000 * 60 * 10) {
			entitlements.delete(key);
		}
	}
}, 1000 * 10);

export const readEntitlement = (entitlement: Entitlement) => {
	return attemptAsync<EntitlementPermission>(async () => {
		const has = entitlements.get(entitlement);
		if (has) {
			has._saved = Date.now();
			return has;
		}
		const e = z
			.object({
				name: z.string(),
				struct: z.string(),
				permissions: z.array(z.string()),
				pages: z.array(z.string())
			})
			.parse(
				YAML.parse(
					await fs.promises.readFile(path.join(ENTITLEMENT_DIR, entitlement + '.yaml'), 'utf8')
				)
			);
		const E = new EntitlementPermission(e.name as Entitlement, e.struct, e.permissions, e.pages);
		entitlements.set(entitlement, E);
		return E;
	});
};

const saveEntitlements = async () => {
	const entitlements = await getEntitlementNames();
	if (entitlements.isErr()) {
		return console.error(entitlements);
	}
	return fs.promises.writeFile(
		ENTITLEMENT_FILE,
		`export type Entitlement = \n    ${entitlements.value.map((e) => `'${e}'`).join('\n  | ')};`
	);
};

// This create process does not need to be optimized because it only runs at the startup process.
export type Permission<T extends Blank = Blank> =
	| `${PropertyAction | '*'}:${Extract<keyof T, string> | '*'}`
	| `${DataAction}`
	| '*';

let timeout: NodeJS.Timeout | undefined;

export const createEntitlement = async <T extends Blank, N extends string>(entitlement: {
	name: string;
	struct: Struct<T, N>;
	permissions: Permission<T & GlobalCols>[];
	pages?: string[];
}) => {
	if (!/[a-z0-9-]+/.test(entitlement.name)) {
		throw new Error(
			`Entitlement name must be lowercase and contain only letters, numbers, and hyphens. (${entitlement.name})`
		);
	}
	await fs.promises.mkdir(ENTITLEMENT_DIR, { recursive: true });
	await fs.promises.writeFile(
		path.join(ENTITLEMENT_DIR, entitlement.name + '.yaml'),
		YAML.stringify({
			name: entitlement.name,
			struct: entitlement.struct.data.name,
			permissions: entitlement.permissions,
			pages: entitlement.pages ?? []
		})
	);

	if (timeout) clearTimeout(timeout);
	setTimeout(async () => {
		saveEntitlements();
	});
};

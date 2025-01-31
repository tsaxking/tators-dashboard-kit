import { attemptAsync, resolveAll, attempt } from 'ts-utils/check';
import YAML from 'yaml';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { Struct, type Blank } from 'drizzle-struct/back-end';
import { DataAction, PropertyAction } from 'drizzle-struct/types';
import type { GlobalCols } from 'drizzle-struct/front-end';
import type { Entitlements } from '$lib/types/entitlements';


const ENTITLEMENT_DIR = path.join(process.cwd(), 'private', 'permissions');
const ENTITLEMENT_FILE = path.join(process.cwd(), 'src', 'lib', 'types', 'entitlements.ts');

export const getPermissions = async () => {
    return attemptAsync(async () => {
        const files = await fs.promises.readdir(ENTITLEMENT_DIR);

        return resolveAll(
            await Promise.all(
                files
                    .filter(f => f.endsWith('.yaml') && !f.includes('example'))
                    .map(readPermissions),
            ),
        );
    });
};

export const readPermissions = (entitlement: string) => {
    return attemptAsync(async () => {
        // const yaml = YAML.parse(await fs.promises.readFile(path.join(ENTITLEMENT_DIR, entitlement), 'utf8'));
        // console.log(yaml);
    });
};

const getCurrentEntitlements = (): string[] => {
    const file = fs.readFileSync(ENTITLEMENT_FILE, 'utf-8');
    return file.match(/'[a-zA-Z0-9]+'/)?.map(e => e.replace(/'/g, '')) ?? [];
};

const saveEntitlements = (entitlements: string[]) => {
    fs.writeFileSync(ENTITLEMENT_FILE, `export type Entitlements = \n    ${entitlements.map(e => `'${e}'`).join('\n  | ')};`);
}

// This create process does not need to be optimized because it only runs at the startup process.
type Permission<T extends Blank = Blank> =
	| `${PropertyAction}:${Extract<keyof T, string>}`
	| `${DataAction}` | '*';

export const createEntitlement = <T extends Blank, N extends string>(entitlement: {
    name: string;
	struct: Struct<T, N>;
	permissions: Permission<T & GlobalCols>[];
	scope: 'global' | 'universe';
}) => {
    if (!/[a-z0-9-]+/.test(entitlement.name)) {
        throw new Error(`Entitlement name must be lowercase and contain only letters, numbers, and hyphens. (${entitlement.name})`);
    }
    fs.mkdirSync(ENTITLEMENT_DIR, { recursive: true });
    fs.writeFileSync(path.join(ENTITLEMENT_DIR, entitlement.name + '.yaml'), YAML.stringify({
        name: entitlement.name,
        struct: entitlement.struct.data.name,
        permissions: entitlement.permissions,
        scope: entitlement.scope,
    }));

    const current = getCurrentEntitlements();
    saveEntitlements(Array.from(new Set([...current, entitlement.name])));
};
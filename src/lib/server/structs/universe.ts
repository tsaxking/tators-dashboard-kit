import { boolean, text } from "drizzle-orm/pg-core";
import { Struct } from "drizzle-struct/back-end";
import { attemptAsync, resolveAll } from "ts-utils/check";
import type { Account } from "./account";

export namespace Universes {
    export const Universe = new Struct({
        name: 'universe',
        structure: {
            name: text('name').notNull(),
            description: text('description').notNull(),
            public: boolean('public').notNull(),
        }
    });

    Universe.on('delete', (u) => {
        Struct.each((s) => {
            s.each((d) => {
                d.removeUniverses(u.id);
            });

            UniverseInvites.fromProperty('universe', u.id, true).pipe(i => i.delete());
        });
    });

    export type UniverseData = typeof Universe.sample;

    export const getUniverses = async (account: Account.AccountData) => {
		return attemptAsync(async () => {
			return resolveAll(
				await Promise.all(
					account.getUniverses().unwrap().map(u => Universes.Universe.fromId(u)),
				)
			).unwrap().filter(Boolean) as Universes.UniverseData[];
		});
	};


    export const UniverseInvites = new Struct({
        name: 'universe_invite',
        structure: {
            universe: text('universe').notNull(),
            account: text('account').notNull(),
            inviter: text('inviter').notNull(),
        }
    });

    export type UniverseInviteData = typeof UniverseInvites.sample;

    export const invite = async (universe: Universes.UniverseData, account: Account.AccountData, inviter: Account.AccountData) => {
        return attemptAsync(async () => {
            return (
                await UniverseInvites.new({
                    universe: universe.id,
                    account: account.id,
                    inviter: inviter.id
                })
            ).unwrap();
        });
    }
}

export const _universeTable = Universes.Universe.table;
export const _universeInviteTable = Universes.UniverseInvites.table;
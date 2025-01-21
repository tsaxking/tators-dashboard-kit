import { integer, text } from "drizzle-orm/pg-core";
import { Struct } from "drizzle-struct/back-end";
import { Account } from "./account";
import { attemptAsync } from "ts-utils";
import { Scouting } from "./scouting";
import { FIRST } from "./FIRST";
import { eq } from "drizzle-orm";

export namespace Potato {
    export const LevelUpMap = {
        scouting: 10,
        prescouting: 5,
        remote: 5,
        rescout: 10,
        pit: 20,
        teamPicture: 5,
    };

    export const Levels = {
        seed: 0,
        sprout: 100,
        plant: 250,
        mature: 500,
        flower: 1_000,
        sentient: 1_500,
        intelligent: 2122,
        divine: 3_000,
        omnipotent: 4_000,
        omnipresent: 5_000,
        god: 7_500,
        tator: 10_000,
    };

    const getPhase = (level: number) => {
        switch (true) {
            case level < Levels.sprout: return 'seed';
            case level < Levels.plant: return 'sprout';
            case level < Levels.mature: return 'plant';
            case level < Levels.flower: return 'mature';
            case level < Levels.sentient: return 'flower';
            case level < Levels.intelligent: return 'sentient';
            case level < Levels.divine: return 'intelligent';
            case level < Levels.omnipotent: return 'divine';
            case level < Levels.omnipresent: return 'omnipotent';
            case level < Levels.god: return 'omnipresent';
            case level < Levels.tator: return 'god';
            default: return 'tator';
        }
    };

    export const Friend = new Struct({
        name: 'potato_friend',
        structure: {
            account: text('account').notNull().unique(),
            level: integer('level').notNull(),
            name: text('name').notNull(),
            lastClicked: text('last_clicked').notNull(),
        },
    });

    export type FriendData = typeof Friend.sample;

    const giveLevels = (potato: FriendData, levels: number) => {
        return attemptAsync(async () => {
            const currentPhase = getPhase(potato.data.level);
            const newLevel = potato.data.level + levels;
            const nowPhase = getPhase(newLevel);
            if (currentPhase !== nowPhase) {
                Account.sendAccountNotif(potato.data.account, {
                    severity: 'success',
                    title: 'Your potato has reached a new phase',
                    message: `Your potato is now a ${nowPhase} (${Levels[nowPhase]})`,
                    icon: '',
                    link: ''
                });
            }

            return (await potato.update({
                level: newLevel,
                lastClicked: levels === 1 ? new Date().toISOString() : potato.data.lastClicked,
            })).unwrap();
        });
    }

    Scouting.MatchScouting.on('create', async s  => {
        const p = await getPotato(s.data.scoutId);
        if (p.isErr()) return console.error(p.error);

        let levels = LevelUpMap.scouting;

        // It won't ever be both, but this handles all cases
        if (s.data.prescouting) levels += LevelUpMap.prescouting;
        if (s.data.remote) levels += LevelUpMap.remote;

        const vh = await s.getVersions();
        if (vh.isErr()) return console.error(vh.error);
        if (vh.value.length) levels += LevelUpMap.rescout;

        giveLevels(p.value, levels);
    });

    Scouting.PIT.Answers.on('create', async a => {
        const p = await getPotato(a.data.accountId);
        if (p.isErr()) return console.error(p.error);

        giveLevels(p.value, LevelUpMap.pit);
    });


    FIRST.TeamPictures.on('create', async pic => {
        const p = await getPotato(pic.data.accountId);
        if (p.isErr()) return console.error(p.error);

        giveLevels(p.value, LevelUpMap.teamPicture);
    });

    export const getPotato = (accountId: string) => {
        return attemptAsync(async () => {
            const p = (await Friend.fromProperty('account', accountId, {
                type: 'single'
            })).unwrap();
            if (p) return p;

            const a = (await Account.Account.fromId(accountId)).unwrap();
            if (!a) throw new Error('Account not found');

            return (await Friend.new({
                account: accountId,
                level: 0,
                name: a.data.username + '\'s Potato',
                lastClicked: new Date().toISOString(),
            })).unwrap();
        });
    };

    export const getRankings = async () => {
        return attemptAsync(async () => {
            return Friend.database
                .select({
                    username: Account.Account.table.username,
                    level: Friend.table.level,
                    name: Friend.table.name,
                })
                .from(Friend.table)
                .orderBy(Friend.table.level)
                .innerJoin(Account.Account.table, eq(Friend.table.account, Account.Account.table.id));
        });
    };
}



export const _potato = Potato.Friend;
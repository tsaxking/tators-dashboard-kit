import { Client } from 'pg';
import { config } from 'dotenv';
import { getOldTables, testAll } from './old-tables';
import { Account } from '../../src/lib/server/structs/account';
import { FIRST } from '../../src/lib/server/structs/FIRST';
import { Scouting } from '../../src/lib/server/structs/scouting';
import { DB } from '../../src/lib/server/db';
import { Struct } from 'drizzle-struct/back-end';
import { z } from 'zod';
import { Strategy } from '../../src/lib/server/structs/strategy';
import { main as backup } from '../backup';
import { main as restore } from '../restore';

const initDB = async () => {
	config();

	const { DB_HOST, DB_PORT, DB_USER, DB_PASS, OLD_DB_NAME } = process.env;
	const DB = new Client({
		user: DB_USER,
		database: OLD_DB_NAME,
		password: DB_PASS,
		port: Number(DB_PORT),
		host: DB_HOST,
		keepAlive: true
	});

	await DB.connect();
	return DB;
};

const reset = () => {
    return restore();
};

export const main = async () => {
    await backup();
    // (await Struct.buildAll(DB)).unwrap();
    const oldDB = await initDB();
	const old = getOldTables(oldDB);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const testRes = (await testAll(old as any)).unwrap();
    if (!testRes.every(Boolean)) {
        console.error('Tests failed');
        process.exit(1);
    }

    const streams: Promise<unknown>[] = [];

    const accountStream = old.Accounts.all();
    streams.push(accountStream.await());
    accountStream.pipe(async a => {
        const exists = (await Account.Account.fromId(a.id)).unwrap();
        if (exists) return;
        (await Account.Account.new({
            id: a.id,
            username: a.username,
            email: a.email,
            key: a.key,
            salt: a.salt,
            picture: a.picture || '/',
            verified: !!a.verified,
            firstName: a.first_name,
            lastName: a.last_name,
            verification: a.verification || '',
        }, {
            overwriteGlobals: true,
        })).unwrap();
    });

    const teamStream = old.Teams.all();
    streams.push(teamStream.await());
    teamStream.pipe(async t => {
        (await FIRST.Teams.new({
            number: t.number,
            watchPriority: t.watch_priority,
            eventKey: t.event_key
        })).unwrap();
    });

    const eventStream = old.Events.all();
    streams.push(eventStream.await());
    eventStream.pipe(async e => {
        (await FIRST.Events.new({
            eventKey: e.event_key,
            flipX: !!e.flip_x,
            flipY: !!e.flip_y,
        })).unwrap();
    });

    const msStream = old.MatchScouting.all();
    streams.push(msStream.await());
    msStream.pipe(async ms => {
        const [match] = z.array(z.object({
            comp_level: z.enum(['qm', 'ef', 'qf', 'sf', 'f', 'pr']),
            event_key: z.string(),
            match_number: z.number().int(),
        })).parse(await oldDB.query(
            `SELECT 
                comp_level,
                event_key,
                match_number
            FROM matches WHERE id = '${ms.match_id}';`
        ));

        if (!match) throw new Error('Match not found');

        (await Scouting.MatchScouting.new({
            compLevel: match.comp_level,
            eventKey: match.event_key,
            matchNumber: match.match_number,
            team: ms.team,
            scoutId: ms.scout_id || '',
            scoutGroup: ms.scout_group,
            prescouting: !!ms.pre_scouting,
            remote: false,
            trace: ms.trace,
            checks: ms.checks,
        })).unwrap();
    });

    await msStream.await();

    const tcStream = old.TeamComments.all();
    streams.push(tcStream.await());
    tcStream.pipe(async tc => {

    });

    const stStream = old.Strategy.all();
    streams.push(stStream.await());

    stStream.pipe(async st => {
        (await Strategy.Strategy.new({
            name: st.name,
            createdBy: st.created_by,
            matchId: st.match_id || '',
            customMatchId: '',
            comment: st.comment,
        })).unwrap();
    });

    await stStream.await();

    const wbStream = old.Whiteboards.all();
    streams.push(wbStream.await());
    wbStream.pipe(async wb => {
        const strategy = (await Strategy.Strategy.fromId(wb.strategy_id)).unwrap();

        if (!strategy) return;

        (await Strategy.Whiteboards.new({
            strategyId: wb.strategy_id,
            board: wb.board,
            name: wb.name,
        })).unwrap();
    });


    await Promise.all(streams);

    oldDB.end();
    process.exit(0);
};

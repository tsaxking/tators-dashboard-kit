import { integer, text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';


export namespace Strategy {
    export const Whiteboards = new Struct({
        name: 'whiteboards',
        structure: {
            strategyId: text('strategy_id').notNull(),
            board: text('board').notNull(),
            name: text('name').notNull(),
        },
        generators: {
            universe: () => '2122',
        },
    });

    export const Strategy = new Struct({
        name: 'strategy',
        structure: {
            name: text('name').notNull(),
            createdBy: text('created_by').notNull(),
            matchId: text('match_id').notNull(),
            customMatchId: text('custom_match_id').notNull(),
            comment: text('comment').notNull(),
        },
        generators: {
            universe: () => '2122',
        },
    });

    export const Alliances = new Struct({
        name: 'alliances',
        structure: {
            name: text('name').notNull(),
            eventKey: text('event_key').notNull(),
            team1: integer('team1').notNull(),
            team2: integer('team2').notNull(),
            team3: integer('team3').notNull(),
            team4: integer('team4').notNull(),
        },
        generators: {
            universe: () => '2122',
        },
    });
}

export const _strategyWhiteboardsTable = Strategy.Whiteboards.table;
export const _strategyTable = Strategy.Strategy.table;
export const _strategyAlliancesTable = Strategy.Alliances.table;
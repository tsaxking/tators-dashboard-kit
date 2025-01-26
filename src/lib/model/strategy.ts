import { Struct } from 'drizzle-struct/front-end';
import { sse } from '../utils/sse';

export namespace Strategy {
    export const Whiteboards = new Struct({
        name: 'whiteboards',
        structure: {
            name: 'string',
            strategyId: 'string',
        },
        socket: sse
    });

    export const Strategy = new Struct({
        name: 'strategy',
        structure: {
            name: 'string',
            createdBy: 'string',
            matchId: 'string',
            customMatchId: 'string',
            comment: 'string',
        },
        socket: sse,
    });

    export const Alliances = new Struct({
        name: 'alliances',
        structure: {
            name: 'string',
            eventKey: 'string',
            team1: 'number',
            team2: 'number',
            team3: 'number',
            team4: 'number',
        },
        socket: sse,
    });
}
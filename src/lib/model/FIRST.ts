import { sse } from '../utils/sse';
import { DataArr, Struct, type StructData } from 'drizzle-struct/front-end';



export namespace FIRST {
    export const Events = new Struct({
        name: 'events',
        structure: {
            eventKey: 'string',
            flipX: 'boolean',
            flipY: 'boolean',
        },
        socket: sse
    });

    export const Teams = new Struct({
        name: 'teams',
        structure: {
            number: 'number',
            eventKey: 'string',
            watchPriority: 'number',
        },
        socket: sse,
    });

    export type TeamData = StructData<typeof Teams.data.structure>;

    export const TeamPictures = new Struct({
        name: 'team_pictures',
        structure: {
            number: 'number',
            eventKey: 'string',
            picture: 'string',
            accountId: 'string',
        },
        socket: sse,
    });

    export const Matches = new Struct({
        name: 'matches',
        structure: {
            eventKey: 'string',
            number: 'number',
            compLevel: 'string',
        },
        socket: sse,
    });


    export type MatchData = StructData<typeof Matches.data.structure>;

    export type MatchDataArr = DataArr<typeof Matches.data.structure>;

    export const CustomMatches = new Struct({
        name: 'custom_matches',
        structure: {
            name: 'string',
            eventKey: 'string',
            number: 'number',
            compLevel: 'string',
            red1: 'number',
            red2: 'number',
            red3: 'number',
            blue1: 'number',
            blue2: 'number',
            blue3: 'number',
        },
        socket: sse,
    });
};
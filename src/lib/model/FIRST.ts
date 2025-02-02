import { sse } from '../utils/sse';
import { Struct, type StructData, type DataArr } from 'drizzle-struct/front-end';
import { browser } from '$app/environment';


export namespace FIRST {
    export const Events = new Struct({
        name: 'events',
        structure: {
            eventKey: 'string',
            flipX: 'boolean',
            flipY: 'boolean',
        },
        socket: sse,
        browser
    });

    export type EventsData = StructData<typeof Events.data.structure>;
    export type EventsArr = DataArr<typeof Events.data.structure>;

    export const Teams = new Struct({
        name: 'teams',
        structure: {
            number: 'number',
            eventKey: 'string',
            watchPriority: 'number',
        },
        socket: sse,
        browser
    });

    export type TeamsData = StructData<typeof Teams.data.structure>;
    export type TeamsArr = DataArr<typeof Teams.data.structure>;

    export const TeamPictures = new Struct({
        name: 'team_pictures',
        structure: {
            number: 'number',
            eventKey: 'string',
            picture: 'string',
            accountId: 'string',
        },
        socket: sse,
        browser
    });

    export type TeamPicturesData = StructData<typeof TeamPictures.data.structure>;
    export type TeamPicturesArr = DataArr<typeof TeamPictures.data.structure>;

    export const Matches = new Struct({
        name: 'matches',
        structure: {
            eventKey: 'string',
            number: 'number',
            compLevel: 'string',
        },
        socket: sse,
        browser
    });

    export type MatchesData = StructData<typeof Matches.data.structure>;
    export type MatchesArr = DataArr<typeof Matches.data.structure>;

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
        browser
    });

    export type CustomMatchesData = StructData<typeof CustomMatches.data.structure>;
    export type CustomMatchesArr = DataArr<typeof CustomMatches.data.structure>;
};
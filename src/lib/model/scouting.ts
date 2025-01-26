import { Struct } from 'drizzle-struct/front-end';
import { sse } from '../utils/sse';


export namespace Scouting {
    export const MatchScouting = new Struct({
        name: 'match_scouting',
        structure: {
            matchId: 'string',
            team: 'number',
            scoutId: 'string',
            scoutGroup: 'string',
            prescouting: 'boolean',
            remote: 'boolean',
            trace: 'string',
            checks: 'string',
        },
        socket: sse
    });


    export const TeamComments = new Struct({
        name: 'team_comments',
        structure: {
            matchScoutingId: 'string',
            accountId: 'string',
            team: 'number',
            comment: 'string',
            type: 'string',
            eventKey: 'string',
        },
        socket: sse
    });


    export namespace PIT {
        export const Sections = new Struct({
            name: 'pit_sections',
            structure: {
                name: 'string',
                multiple: 'boolean',
                accountId: 'string',
            },
            socket: sse
        });


        export const Groups = new Struct({
            name: 'pit_groups',
            structure: {
                eventKey: 'string',
                sectionId: 'string',
                name: 'string',
                accountId: 'string',
            },
            socket: sse
        });

        export const Qustions = new Struct({
            name: 'pit_questions',
            structure: {
                groupId: 'string',
                question: 'string',
                type: 'string',
                accountId: 'string',
            },
            socket: sse
        });

        export const Answers = new Struct({
            name: 'pit_answers',
            structure: {
                questionId: 'string',
                accountId: 'string',
                value: 'string',
                matchId: 'string',
            },
            socket: sse
        });
    }
}
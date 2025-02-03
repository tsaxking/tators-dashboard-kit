import { Struct, type StructData, type DataArr } from 'drizzle-struct/front-end';
import { sse } from '../utils/sse';
import { browser } from '$app/environment';


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
        socket: sse,
        browser
    });

    export type MatchScoutingData = StructData<typeof MatchScouting.data.structure>;
    export type MatchScoutingArr = DataArr<typeof MatchScouting.data.structure>;


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
        socket: sse,
        browser
    });

    export type TeamCommentsData = StructData<typeof TeamComments.data.structure>;
    export type TeamCommentsArr = DataArr<typeof TeamComments.data.structure>;


    export namespace PIT {
        export const Sections = new Struct({
            name: 'pit_sections',
            structure: {
                name: 'string',
                multiple: 'boolean',
                accountId: 'string',
            },
            socket: sse,
            browser
        });

        export type SectionData = StructData<typeof Sections.data.structure>;
        export type SectionArr = DataArr<typeof Sections.data.structure>;


        export const Groups = new Struct({
            name: 'pit_groups',
            structure: {
                eventKey: 'string',
                sectionId: 'string',
                name: 'string',
                accountId: 'string',
            },
            socket: sse,
            browser
        });

        export type GroupData = StructData<typeof Groups.data.structure>;
        export type GroupArr = DataArr<typeof Groups.data.structure>;

        export const Qustions = new Struct({
            name: 'pit_questions',
            structure: {
                groupId: 'string',
                question: 'string',
                type: 'string',
                accountId: 'string',
            },
            socket: sse,
            browser
        });

        export type QuestionData = StructData<typeof Qustions.data.structure>;
        export type QuestionArr = DataArr<typeof Qustions.data.structure>;

        export const Answers = new Struct({
            name: 'pit_answers',
            structure: {
                questionId: 'string',
                accountId: 'string',
                value: 'string',
                matchId: 'string',
            },
            socket: sse,
            browser
        });

        export type AnswerData = StructData<typeof Answers.data.structure>;
        export type AnswerArr = DataArr<typeof Answers.data.structure>;
    }
}
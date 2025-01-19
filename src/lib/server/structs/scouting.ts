import { boolean } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';


export namespace Scouting {
    export const MatchScouting = new Struct({
        name: 'match_scouting',
        structure: {
            matchId: text('match_id').notNull(),
            team: integer('team').notNull(),
            scoutId: text('scout_id').notNull(),
            scoutGroup: text('scout_group').notNull(),
            prescouting: boolean('prescouting').notNull(),
            remote: boolean('remote').notNull(),
            trace: text('trace').notNull(),
            checks: text('checks').notNull(),
        },
        versionHistory: {
            type: 'versions',
            amount: 3,
        }
    });

    export const TeamComments = new Struct({
        name: 'team_comments',
        structure: {
            matchScoutingId: text('match_Scouting_id').notNull(),
            accountId: text('account_id').notNull(),
            team: integer('team').notNull(),
            comment: text('comment').notNull(),
            type: text('type').notNull(),
            eventKey: text('event_key').notNull(),
        },
        versionHistory: {
            type: 'versions',
            amount: 3,
        }
    });

    export namespace PIT {
        export const Sections = new Struct({
            name: 'pit_sections',
            structure: {
                name: text('name').notNull(),
                multiple: boolean('multiple').notNull(),
                accountId: text('account_id').notNull(),
            },
            versionHistory: {
                type: 'versions',
                amount: 3,
            }
        });

        export const Groups = new Struct({
            name: 'pit_groups',
            structure: {
                eventKey: text('event_key').notNull(),
                sectionId: text('section_id').notNull(),
                name: text('name').notNull(),
                accountId: text('account_id').notNull(),
            },
            versionHistory: {
                type: 'versions',
                amount: 3,
            }
        });

        export const Questions = new Struct({
            name: 'pit_questions',
            structure: {
                question: text('question').notNull(),
                groupId: text('group_id').notNull(),
                key: text('key').notNull(),
                description: text('description').notNull(),
                type: text('type').notNull(), // boolean/number/text/textarea/etc.
                accountId: text('account_id').notNull(),
                options: text('options').notNull(), // JSON string[] for checkboxes/radios
            },
            versionHistory: {
                type: 'versions',
                amount: 3,
            }
        });

        export const Answers = new Struct({
            name: 'pit_answers',
            structure: {
                questionId: text('question_id').notNull(),
                answer: text('answer').notNull(),
                team: integer('team').notNull(),
                accountId: text('account_id').notNull(),
            },
            versionHistory: {
                type: 'versions',
                amount: 3,
            }
        });
    }
}

export const _scoutingMatchScoutingTable = Scouting.MatchScouting.table;
export const _scoutingTeamCommentsTable = Scouting.TeamComments.table;
export const _scoutingPitSectionsTable = Scouting.PIT.Sections.table;
export const _scoutingPitGroupsTable = Scouting.PIT.Groups.table;
export const _scoutingPitQuestionsTable = Scouting.PIT.Questions.table;
export const _scoutingPitAnswersTable = Scouting.PIT.Answers.table;
import { integer } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';

export namespace Checklist {
    export const Checklists = new Struct({
        name: 'checklists',
        structure: {
            name: text('name').notNull(),
            eventKey: text('event_key').notNull(),
            description: text('description').notNull(),
        },
    });


    export const Questions = new Struct({
        name: 'checklist_questions',
        structure: {
            checklistId: text('checklist_id').notNull(),
            question: text('question').notNull(),
            interval: integer('interval').notNull(), // number of matches between
        },
    });


    export const Assignments = new Struct({
        name: 'checklist_assignments',
        structure: {
            questionId: text('question_id').notNull(),
            accountId: text('account_id').notNull(),
        },
    });

    export const Answers = new Struct({
        name: 'checklist_answers',
        structure: {
            accountId: text('account_id').notNull(),
            questionId: text('question_id').notNull(),
            matchId: text('match_id').notNull(),
        },
    });
}


export const _checklistTable = Checklist.Checklists.table;
export const _checklistQuestionsTable = Checklist.Questions.table;
export const _checklistAssignmentsTable = Checklist.Assignments.table;
export const _checklistAnswersTable = Checklist.Answers.table;
export const _checklistAnswersTableStructure = Checklist.Answers.table;
import { Struct } from 'drizzle-struct/front-end';
import { sse } from '../utils/sse';


export namespace Checklist {
    export const Checklists = new Struct({
        name: 'checklists',
        structure: {
            name: 'string',
            eventKey: 'string',
            description: 'string',
        },
        socket: sse
    });

    export const Questions = new Struct({
        name: 'checklist_questions',
        structure: {
            checklistId: 'string',
            question: 'string',
            interval: 'number',
        },
        socket: sse,
    });

    export const Assignments = new Struct({
        name: 'checklist_assignments',
        structure: {
            questionId: 'string',
            accountId: 'string',
        },
        socket: sse,
    });

    export const Answers = new Struct({
        name: 'checklist_answers',
        structure: {
            accountId: 'string',
            questionId: 'string',
            matchId: 'string',
        },
        socket: sse,
    });
}
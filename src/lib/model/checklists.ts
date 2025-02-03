import { type DataArr, Struct, type StructData } from 'drizzle-struct/front-end';
import { sse } from '../utils/sse';
import { browser } from '$app/environment';

export namespace Checklist {
	export const Checklists = new Struct({
		name: 'checklists',
		structure: {
			name: 'string',
			eventKey: 'string',
			description: 'string'
		},
		socket: sse,
		browser
	});

	export type ChecklistData = StructData<typeof Checklists.data.structure>;
	export type ChecklistArr = DataArr<typeof Checklists.data.structure>;

	export const Questions = new Struct({
		name: 'checklist_questions',
		structure: {
			checklistId: 'string',
			question: 'string',
			interval: 'number'
		},
		socket: sse,
		browser
	});

	export type QuestionData = StructData<typeof Questions.data.structure>;
	export type QuestionArr = DataArr<typeof Questions.data.structure>;

	export const Assignments = new Struct({
		name: 'checklist_assignments',
		structure: {
			questionId: 'string',
			accountId: 'string'
		},
		socket: sse,
		browser
	});

	export type AssignmentData = StructData<typeof Assignments.data.structure>;
	export type AssignmentArr = DataArr<typeof Assignments.data.structure>;

	export const Answers = new Struct({
		name: 'checklist_answers',
		structure: {
			accountId: 'string',
			questionId: 'string',
			matchId: 'string'
		},
		socket: sse,
		browser
	});

	export type AnswerData = StructData<typeof Answers.data.structure>;
	export type AnswerArr = DataArr<typeof Answers.data.structure>;
}

import { sse } from '$lib/utils/sse';
import { Struct, type Structable } from 'drizzle-struct/front-end';


export namespace Test {
	export const Test = new Struct({
		name: 'account',
		structure: {
            name: 'string',
            age: 'number',
        },
		socket: sse
	});


	export type TestData = Structable<typeof Test.data.structure>;
	export type State = 'not started' | 'in progress' | 'success' | 'failure';

    export const unitTest = () => {

		const tests: {
			connect: State,
			new: State,
			update: State,

			archive: State,
			restore: State,
			delete: State,

			readVersion: State,
			deleteVersion: State,

			readAll: State,
			readArchived: State,
			readFromProperty: State,

			emitNew: State,
			emitUpdate: State,
			emitArchive: State,
			emitRestore: State,
			emitDelete: State,
		} = $state({
			connect: 'not started',
			new: 'not started',
			update: 'not started',
	
			archive: 'not started',
			restore: 'not started',
			delete: 'not started',
	
			readVersion: 'not started',
			deleteVersion: 'not started',
	
			readAll: 'not started',
			readArchived: 'not started',
			readFromProperty: 'not started',
	
			emitNew: 'not started',
			emitUpdate: 'not started',
			emitArchive: 'not started',
			emitRestore: 'not started',
			emitDelete: 'not started',
		});

		const states = ['not started', 'in progress', 'success', 'failure'];

		setInterval(() => {
			const state = states[Math.floor(Math.random() * states.length)] as State;
			const key = Object.keys(tests)[Math.floor(Math.random() * Object.keys(tests).length)] as keyof typeof tests;
			tests[key] = state;
		}, 1000);

		return tests;
	};
}

import { sse } from '$lib/utils/sse';
import { Struct, type Structable } from 'drizzle-struct/front-end';


export namespace Test {
	export const Test = new Struct({
		name: 'test',
		structure: {
            name: 'string',
            age: 'number',
        },
		socket: sse
	});


	export type TestData = Structable<typeof Test.data.structure>;
	export type State = 'not started' | 'in progress' | 'success' | 'failure';

	export type Status = {
		state: State;
		message?: string;
	}

    export const unitTest = () => {
		const init = (): Status => ({
			state: 'not started',
		});

		const tests: {
			connect: Status;
			new: Status;
			update: Status;

			archive: Status;
			restore: Status;
			delete: Status;

			readVersion: Status;
			deleteVersion: Status;

			readAll: Status;
			readArchived: Status;
			readFromProperty: Status;

			emitNew: Status;
			emitUpdate: Status;
			emitArchive: Status;
			emitRestore: Status;
			emitDelete: Status;

			pullData: Status,
		} = $state({
			connect: init(),
			new: init(),
			update: init(),

			archive: init(),
			restore: init(),
			delete: init(),

			readVersion: init(),
			deleteVersion: init(),

			readAll: init(),
			readArchived: init(),
			readFromProperty: init(),

			emitNew: init(),
			emitUpdate: init(),
			emitArchive: init(),
			emitRestore: init(),
			emitDelete: init(),

			pullData: init(),
		});


		// cute little randomizer
		// const states = ['not started', 'in progress', 'success', 'failure'];

		// setInterval(() => {
		// 	const state = states[Math.floor(Math.random() * states.length)] as State;
		// 	const key = Object.keys(tests)[Math.floor(Math.random() * Object.keys(tests).length)] as keyof typeof tests;
		// 	tests[key] = state;
		// }, 1000);


		(async () => {
			tests.connect.state = 'in progress';
			const res = await Test.connect();
			if (res.isErr()) {
				tests.connect.state = 'failure';
				tests.connect.message = res.error.message;
				return;
			}
			if (res.value.success) {
				tests.connect.state = 'success';
				tests.connect.message = res.value.message;
			} else {
				tests.connect.state = 'failure';
				tests.connect.message = res.value.message;
			}

			const uniqueName = Math.random().toString(36).substring(7);
			
			Test.on('archive', (data) => {
				tests.archive.state = 'success';
			});

			Test.on('delete', (data) => {
				tests.delete.state = 'success';
			});

			Test.on('new', (data) => {
				if (data.data.name === uniqueName) tests.new.state = 'success';
			});

			Test.on('restore', (data) => {
				tests.restore.state = 'success';
			});

			Test.on('update', (data) => {
				tests.update.state = 'success';
			});

			tests.new.state = 'in progress';

			const createRes = await Test.new({
				name: uniqueName,
				age: 20,
			});

			if (createRes.isErr()) {
				tests.new.state = 'failure';
				tests.new.message = createRes.error.message;
				return;
			}
		})();

		return tests;
	};
}

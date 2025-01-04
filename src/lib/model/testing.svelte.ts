import { browser } from '$app/environment';
import { sse } from '$lib/utils/sse';
import { Struct, type Structable } from 'drizzle-struct/front-end';


export namespace Test {
	export const Test = new Struct({
		name: 'test',
		structure: {
            name: 'string',
            age: 'number',
        },
		socket: sse,
		// log: true,
	});


	export type TestData = Structable<typeof Test.data.structure>;
	export type State = 'not started' | 'in progress' | 'success' | 'failure';

	export type Status = {
		state: State;
		message?: string;

		update(state: State, message?: string): void;
	}

    export const unitTest = () => {
		const init = (): Status => ({
			state: 'not started',

			update(state: State, message?: string) {
				if (this.state === 'success' || this.state === 'failure') return;
				this.state = state;
				if (message) this.message = message;
			}
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

			receivedNew: Status;
			receivedUpdate: Status;
			receivedArchive: Status;
			receivedRestore: Status;
			receivedDelete: Status;

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

			receivedNew: init(),
			receivedUpdate: init(),
			receivedArchive: init(),
			receivedRestore: init(),
			receivedDelete: init(),

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
			if (!browser) return;
			(await Test.build()).unwrap();

			tests.connect.update('in progress');
			const res = await Test.connect();
			if (res.isErr()) {
				tests.connect.update('failure');
				tests.connect.message = res.error.message;
				return;
			}
			if (res.value.success) {
				tests.connect.update('success');
				tests.connect.message = res.value.message;
			} else {
				tests.connect.update('failure');
				tests.connect.message = res.value.message;
			}

			const uniqueName = Math.random().toString(36).substring(7);
			console.log('uniqueName', uniqueName);
			
			Test.on('archive', (data) => {
				tests.archive.update('success');
			});

			Test.on('delete', (data) => {
				tests.delete.update('success');
			});

			Test.on('new', (data) => {
				if (data.data.name === uniqueName) {
					tests.receivedNew.update('success');
				}
			});

			Test.on('restore', (data) => {
				tests.restore.update('success');
			});

			Test.on('update', (data) => {
				if (data.data.name === uniqueName) {
					console.log('update', data);
					tests.receivedUpdate.update('success');
				}
			});

			tests.new.update('in progress');

			const createRes = await Test.new({
				name: uniqueName,
				age: 20,
			});
			tests.receivedNew.update('in progress');

			if (createRes.isErr()) {
				tests.new.update('failure');
				tests.new.message = createRes.error.message;
				return;
			} else if (!createRes.value.success) {
				tests.new.update('failure');
				tests.new.message = createRes.value.message || 'No message';
				return;
			}

			tests.new.update('success');
			tests.readAll.update('in progress');

			const readAllStream = Test.all(true);
			readAllStream.on('data', async (d) => {
				if (d.data.name === uniqueName) {
					tests.readAll.update('success');

					tests.update.update('in progress');
					tests.receivedUpdate.update('in progress');

					const updateRes = await d.update((data) => ({
						...data,
						age: 21,
					}));

					if (updateRes.isErr()) {
						tests.update.update('failure');
						tests.update.message = updateRes.error.message;
						return;
					}

					console.log('updateRes', updateRes.value);
				
					if (!updateRes.value.result.success) {
						tests.update.update('failure');
						tests.update.message = updateRes.value.result.message || 'No message';
						return;
					}

					tests.update.update('success');

					tests.archive.update('in progress');
					tests.receivedArchive.update('in progress');
					tests.receivedRestore.update('in progress');

					const archiveRes = await d.setArchive(true);
					if (archiveRes.isErr()) {
						tests.archive.update('failure');
						tests.archive.message = archiveRes.error.message;
						return;
					}

					if (!archiveRes.value.success) {
						tests.archive.update('failure');
						tests.archive.message = archiveRes.value.message || 'No message';
						return;
					}

					tests.archive.update('success');

					tests.restore.update('in progress');

					const restoreRes = await d.setArchive(false);
					if (restoreRes.isErr()) {
						tests.restore.update('failure');
						tests.restore.message = restoreRes.error.message;
						return;
					}

					if (!restoreRes.value.success) {
						tests.restore.update('failure');
						tests.restore.message = restoreRes.value.message || 'No message';
						return;
					}

					tests.restore.update('success');

				}
			});

			readAllStream.on('error', (e) => {
				console.error('Error', e);
				tests.readAll.update('failure', e.message);
			});

		})();

		return tests;
	};
}

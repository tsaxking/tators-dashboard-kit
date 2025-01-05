import { browser } from '$app/environment';
import { sse } from '$lib/utils/sse';
import { Struct, StructData } from 'drizzle-struct/front-end';


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


	export type TestData = StructData<typeof Test.data.structure>;
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
			
			const uniqueName = Math.random().toString(36).substring(7);
			console.log('uniqueName', uniqueName);

			const connect = async () => {
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
			};

			const testNew = async () => {
				return new Promise<void>((res) => {
					tests.receivedNew.update('in progress');
					tests.new.update('in progress');
					let resolved = false;
					const finish = (error?: string) => {
						if (!resolved) res();
						resolved = true;
						if (error) {
							tests.receivedNew.update('failure', error);
						} else {
							tests.receivedNew.update('success');
						}

						Test.off('new', onNew);
					}

					setTimeout(() => {
						finish('Timeout');
					}, 1000);

					const onNew = (data: TestData) => {
						if (data.data.name === uniqueName) {
							finish();
						}
					};

					Test.on('new', onNew);

					Test.new({
						name: uniqueName,
						age: 20,
					}).then(r => {
						if (r.isErr()) {
							return tests.new.update('failure', r.error.message);
						}

						if (!r.value.success) {
							return tests.new.update('failure', r.value.message || 'No message');
						}

						tests.new.update('success');
					});
				});
			};

			const testUpdate = async (data: TestData) => {
				return new Promise<void>((res) => {
					tests.receivedUpdate.update('in progress');
					tests.update.update('in progress');
					let resolved = false;
					const finish = (error?: string) => {
						if (!resolved) res();
						resolved = true;
						if (error) {
							tests.receivedUpdate.update('failure', error);
						} else {
							tests.receivedUpdate.update('success');
						}
					}

					setTimeout(() => {
						finish('Timeout');
					}, 1000);

					const onUpdate = (data: TestData) => {
						if (data.data.name === uniqueName) {
							finish();
						}
					}

					Test.on('update', onUpdate);

					data.update(d => ({
						...d,
						age: 21,
					})).then(r => {
						if (r.isErr()) {
							return tests.update.update('failure', r.error.message);
						}

						if (!r.value.success) {
							return tests.update.update('failure', r.value.message || 'No message');
						}

						tests.update.update('success');
					});
				});
			};

			const testReadAll = async () => {
				return new Promise<void>((res) => {
					tests.readAll.update('in progress');
					let resolved = false;
					const finish = (error?: string) => {
						if (!resolved) res();
						resolved = true;
						if (error) {
							tests.readAll.update('failure', error);
						} else {
							tests.readAll.update('success');
						}

						stream.off('data', onData);
						stream.off('error', onError);
					}

					setTimeout(() => {
						finish('Timeout');
					}, 1000);

					const onData = (data: TestData) => {
						if (data.data.name === uniqueName) {
							finish();
						}
					};

					const onError = (error: Error) => {
						finish(error.message);
					}

					const stream = Test.all(true);
					stream.on('data', onData);
					stream.on('error', onError);
				});
			};

			const testArchive = async (data: TestData) => {
				return new Promise<void>((res) => {
					tests.receivedArchive.update('in progress');
					tests.archive.update('in progress');
					let resolved = false;
					const finish = (error?: string) => {
						if (!resolved) res();
						resolved = true;
						if (error) {
							tests.receivedArchive.update('failure', error);
						} else {
							tests.receivedArchive.update('success');
						}
					}

					setTimeout(() => {
						finish('Timeout');
					}, 1000);

					const onArchive = (data: TestData) => {
						if (data.data.name === uniqueName) {
							finish();
						}
					}

					Test.on('archive', onArchive);

					data.setArchive(true).then(r => {
						if (r.isErr()) {
							return tests.archive.update('failure', r.error.message);
						}

						if (!r.value.success) {
							return tests.archive.update('failure', r.value.message || 'No message');
						}

						tests.archive.update('success');
					});
				});
			};

			const testRestore = async (data: TestData) => {
				return new Promise<void>((res) => {
					tests.receivedRestore.update('in progress');
					tests.restore.update('in progress');
					let resolved = false;
					const finish = (error?: string) => {
						if (!resolved) res();
						resolved = true;
						if (error) {
							tests.receivedRestore.update('failure', error);
						} else {
							tests.receivedRestore.update('success');
						}
					}

					setTimeout(() => {
						finish('Timeout');
					}, 1000);

					const onRestore = (data: TestData) => {
						if (data.data.name === uniqueName) {
							finish();
						}
					}

					Test.on('restore', onRestore);

					data.setArchive(false).then(r => {
						if (r.isErr()) {
							return tests.restore.update('failure', r.error.message);
						}

						if (!r.value.success) {
							return tests.restore.update('failure', r.value.message || 'No message');
						}

						tests.restore.update('success');
					});
				});
			};

			const testDelete = async (data: TestData) => {
				return new Promise<void>((res) => {
					tests.receivedDelete.update('in progress');
					tests.delete.update('in progress');
					let resolved = false;
					const finish = (error?: string) => {
						if (!resolved) res();
						resolved = true;
						if (error) {
							tests.receivedDelete.update('failure', error);
						} else {
							tests.receivedDelete.update('success');
						}
					}

					setTimeout(() => {
						finish('Timeout');
					}, 1000);

					const onDelete = (data: TestData) => {
						if (data.data.name === uniqueName) {
							finish();
						}
					}

					Test.on('delete', onDelete);

					data.delete().then(r => {
						if (r.isErr()) {
							return tests.delete.update('failure', r.error.message);
						}

						if (!r.value.success) {
							return tests.delete.update('failure', r.value.message || 'No message');
						}

						tests.delete.update('success');
					});
				});
			};

			const testPull = async (data: TestData) => {
				const pulled = data.pull('name', 'age');
				if (!pulled) {
					tests.pullData.update('failure', 'Could not pull data');
					return;
				}

				if (!Object.hasOwn(pulled, 'name')) {
					tests.pullData.update('failure', 'Name not found');
					return;
				}

				if (!Object.hasOwn(pulled, 'age')) {
					tests.pullData.update('failure', 'Age not found');
					return;
				}

				tests.pullData.update('success');
			};

			const testVersions = async (data: TestData) => {
				const versions = await data.getVersions();
				if (versions.isErr()) {
					tests.readVersion.update('failure', versions.error.message);
					return;
				}

				if (versions.value.length === 0) {
					tests.readVersion.update('failure', 'No versions found');
					return;
				}

				const version = versions[0];
				const versionData = version.getData();
				if (!versionData) {
					tests.readVersion.update('failure', 'No data found');
					return;
				}

				if (versionData.name !== uniqueName) {
					tests.readVersion.update('failure', 'Name does not match');
					return;
				}

				tests.readVersion.update('success');

				const deleted = version.delete();
				if (deleted.isErr()) {
					tests.deleteVersion.update('failure', deleted.error.message);
					return;
				}

				if (!deleted.value.success) {
					tests.deleteVersion.update('failure', deleted.value.message || 'No message');
					return;
				}

				tests.deleteVersion.update('success');
			};
		})();

		return tests;
	};
}

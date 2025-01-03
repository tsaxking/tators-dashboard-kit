/* eslint-disable @typescript-eslint/no-explicit-any */
import { DB } from '../lib/server/db/index';
import { test, expect } from 'vitest';
import { Test } from '../lib/server/structs/testing';
import { describe } from 'vitest';

describe('Struct Init', async () => {
	(await Test.Test.build(DB as any)).unwrap();

	test('Test Struct', async () => {
		(await Test.Test.clear()).unwrap();

		const testNew = (
			await Test.Test.new({
				name: 'test',
				age: 'test'
			})
		).unwrap();

		expect(testNew.data.name).toBe('test');

		const selected = (await Test.Test.fromProperty('name', 'test', false)).unwrap();
		if (selected.length === 0) {
			throw new Error('No results found');
		}

		const [testSelected] = selected;
		expect(testSelected.data.name).toBe('test');

		(
			await testSelected.update({
				name: 'test2'
			})
		).unwrap();

		const updated = (await Test.Test.fromProperty('name', 'test2', false)).unwrap();

		if (updated.length === 0) {
			throw new Error('No results found');
		}

		const [testUpdated] = updated;

		expect(testUpdated.data.name).toBe('test2');

		(await testSelected.delete()).unwrap();

		const deleted = (await Test.Test.fromProperty('name', 'test2', false)).unwrap();

		expect(deleted.length).toBe(0);
	});
});

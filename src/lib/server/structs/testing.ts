import { text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';

console.log(
	`This file (${__filename}) should only be used for unit tests. If you are seeing this outside of a unit testing environment, there is an issue with the program.`
);

export namespace Test {
	export const Test = new Struct({
		name: 'test',
		structure: {
			name: text('name').notNull(),
			age: text('age').notNull()
		}
	});
}

export const _test = Test.Test.table;

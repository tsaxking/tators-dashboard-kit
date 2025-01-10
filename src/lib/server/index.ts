/* eslint-disable @typescript-eslint/no-explicit-any */
import { Struct } from 'drizzle-struct/back-end';
import './structs/account';
import './structs/session';
import './structs/permissions';
import { DB } from './db';
import { handleEvent, connectionEmitter } from './event-handler';

Struct.each((struct) => {
	if (!struct.built) {
		struct.build(DB as any);
		struct.eventHandler(handleEvent(struct));
		connectionEmitter(struct);
	}
});

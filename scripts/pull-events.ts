import * as TBA from '../src/lib/server/utils/tba';
import { Struct } from 'drizzle-struct/back-end';
import { z } from 'zod';
import { DB } from '../src/lib/server/db';

export default async () => {
	(await Struct.buildAll(DB)).unwrap();
	const events = (await TBA.Event.getEvents(2024)).unwrap();
	console.log(events);
};

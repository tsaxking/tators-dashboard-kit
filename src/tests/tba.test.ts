import { describe, expect, test } from 'vitest';
import * as TBA from '$lib/server/utils/tba';
import { Struct } from 'drizzle-struct/back-end';
import { DB } from '$lib/server/db';

describe('TheBlueAlliance testing', async () => {
	(await Struct.buildAll(DB)).unwrap();

	test('Get all 2024 events', async () => {
		const events = (await TBA.Event.getEvents(2024)).unwrap();

		expect(events.length).toBeGreaterThan(0);

		const [event] = events;
		const [matches, teams] = await Promise.all([event.getMatches(), event.getTeams()]);

		const m = matches.unwrap();
		const t = teams.unwrap();

		expect(m.length).toBeGreaterThan(0);
		expect(t.length).toBeGreaterThan(0);
	});
});

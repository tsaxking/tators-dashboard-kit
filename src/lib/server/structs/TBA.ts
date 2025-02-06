import { integer } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';
import { attemptAsync, resolveAll, type Result } from 'ts-utils/check';
import { z } from 'zod';

const { TBA_KEY } = process.env;
if (!TBA_KEY) throw new Error('TBA_KEY not found in .env file');

export namespace TBA {
	const BASE_URL = 'https://www.thebluealliance.com/api/v3';

	export const Requests = new Struct({
		name: 'tba_requests',
		structure: {
			url: text('url').notNull().unique(),
			response: text('response').notNull()
		},
		generators: {
			universe: () => '2122'
		}
	});

	export const Events = new Struct({
		name: 'tba_custom_events',
		structure: {
			year: integer('year').notNull(),
			eventKey: text('event_key').notNull(),
			data: text('data').notNull() // JSON Event Object
		},
		generators: {
			universe: () => '2122'
		}
	});

	Events.on('delete', async (e) => {
		const [teams, matches] = await Promise.all([
			Teams.fromProperty('eventKey', e.data.eventKey, { type: 'array', limit: 1000, offset: 0 }),
			Matches.fromProperty('eventKey', e.data.eventKey, { type: 'array', limit: 1000, offset: 0 })
		]);

		const res = resolveAll(
			await Promise.all([
				...teams.unwrap().map((t) => t.delete()),
				...matches.unwrap().map((m) => m.delete())
			])
		);
		if (res.isErr()) console.error(res.error);
	});

	export const Teams = new Struct({
		name: 'tba_custom_teams',
		structure: {
			eventKey: text('event_key').notNull(),
			teamKey: text('team_key').notNull(), // frcXXXX
			data: text('data').notNull() // JSON Team Object
		},
		generators: {
			universe: () => '2122'
		}
	});

	export const Matches = new Struct({
		name: 'tba_custom_matches',
		structure: {
			eventKey: text('event_key').notNull(),
			matchKey: text('match_key').notNull(), // 2020casj_qf1m1
			data: text('data').notNull() // JSON Match Object
		},
		generators: {
			universe: () => '2122'
		}
	});

	type RequestConfig = {
		timeout?: number;
		updateThreshold: number;
	};

	export const get = <T>(path: string, config: RequestConfig): Promise<Result<T>> => {
		return attemptAsync(async () => {
			if (!path.startsWith('/')) path = '/' + path;

			const exists = await Requests.fromProperty('url', path, {
				type: 'single'
			});

			if (exists.isOk() && exists.value) {
				const between = Date.now() - exists.value.updated.getTime();
				if (between < config.updateThreshold) {
					return JSON.parse(exists.value.data.response) as T;
				} else {
					(await exists.value.delete()).unwrap(); // remove duplicates
				}
			}

			return new Promise<T>((res, rej) => {
				const t = setTimeout(
					() => {
						rej();
					},
					config?.timeout ?? 1000 * 10
				);

				fetch(`${BASE_URL}${path}`, {
					method: 'GET',
					headers: {
						'X-TBA-Auth-Key': TBA_KEY || 'tba_key',
						Accept: 'application/json'
					}
				})
					.then((r) => r.json())
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.then((json: any) => {
						if (json.Error) return rej(json.Error);
						clearTimeout(t);
						res(json as T);

						if (config.updateThreshold > 0) {
							Requests.new({
								url: path,
								response: JSON.stringify(json)
							});
						}
					})
					.catch(rej);
			});
		});
	};
}

export const _tbaRequestsTable = TBA.Requests.table;
export const _tbaEventsTable = TBA.Events.table;
export const _tbaTeamsTable = TBA.Teams.table;
export const _tbaMatchesTable = TBA.Matches.table;

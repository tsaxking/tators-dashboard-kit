import { integer } from 'drizzle-orm/pg-core';
import { boolean, text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';
import { attemptAsync, type Result } from 'ts-utils/check';

const { TBA_KEY } = process.env;

export namespace TBA {
    const BASE_URL = 'https://www.thebluealliance.com/api/v3'

    export const Requests = new Struct({
        name: 'tba_requests',
        structure: {
            url: text('url').notNull().unique(),
            response: text('response').notNull(),
        },
    });

    export const Events = new Struct({
        name: 'tba_custom_events',
        structure: {
            year: integer('year').notNull(),
            eventKey: text('event_key').notNull(),
            data: text('data').notNull(), // JSON Event Object
        },
    });

    export const Teams = new Struct({
        name: 'tba_custom_teams',
        structure: {
            eventKey: text('event_key').notNull(),
            teamKey: text('team_key').notNull(), // frcXXXX
            data: text('data').notNull(), // JSON Team Object
        }
    });

    export const Matches = new Struct({
        name: 'tba_custom_matches',
        structure: {
            eventKey: text('event_key').notNull(),
            matchKey: text('match_key').notNull(), // 2020casj_qf1m1
            data: text('data').notNull(), // JSON Match Object
        },
    });

    type RequestConfig = {
        timeout?: number;
        updateThreshold: number;
    };

    export const get = <T>(
        path: string,
        config: RequestConfig,
    ): Promise<Result<T>> => {
        return attemptAsync(async () => {
            if (!path.startsWith('/')) path = '/' + path;

            const exists = await Requests.fromProperty('url', path, {
                type: 'single',
            });

            if (exists.isOk() && exists.value) {
                const between = Date.now() - exists.value.updated.getTime();
                if (between < (config.updateThreshold)) {
                    return JSON.parse(exists.value.data.response) as T;
                } else {
                    (await exists.value.delete()).unwrap(); // remove duplicates
                }
            }

            return new Promise<T>((res, rej) => {
                const t = setTimeout(() => {
                    rej()
                }, config?.timeout ?? 1000 * 10);


                fetch(`${BASE_URL}${path}`, {
                    method: 'GET',
                    headers: {
                        'X-TBA-Auth-Key': TBA_KEY || 'tba_key',
                        'Accept': 'application/json',
                    }
                })
                .then(r => r.json())
                .then(json => {
                    if (json.Error) return rej(json.Error);
                    clearTimeout(t);
                    res(json as T);

                    if (config.updateThreshold > 0) {
                        Requests.new({
                            url: path,
                            response: JSON.stringify(json),
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
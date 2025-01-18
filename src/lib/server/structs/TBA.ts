import { boolean, text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';
import { attemptAsync, Result } from 'ts-utils/check';

export namespace TBA {
    const BASE_URL = 'https://www.thebluealliance.com/api/v3'

    export const Requests = new Struct({
        name: 'tba_requests',
        structure: {
            url: text('url').notNull(),
            response: text('response').notNull(),
            update: boolean('update').notNull(),
        },
    });

    type RequestConfig = Partial<{
        timeout: number;
    }>;

    export const get = <T>(
        path: string,
        config?: RequestConfig,
    ): Promise<Result<T>> => {
        return attemptAsync(async () => {
            if (!path.startsWith('/')) path = '/' + path;

            return new Promise<T>((res, rej) => {
                const t = setTimeout(() => {
                    rej()
                }, config?.timeout ?? 1000 * 10);


                fetch(`${BASE_URL}${path}`, {
                    method: 'GET',
                    headers: {
                        'X-TBA-Auth-Key': '',
                        'Accept': 'application/json',
                    }
                })
                .then(r => r.json())
                .then(json => {
                    clearTimeout(t);
                    res(json as T);
                })
                .catch(rej);
            });
        });
    };
}


export const _tbaRequestsTable = TBA.Requests.table;
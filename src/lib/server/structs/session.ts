import { DOMAIN, SESSION_DURATION } from "$env/static/private";
import { attemptAsync } from "$lib/ts-utils/check";
import { DB } from "../db";
import { Struct } from "../struct";
import { integer, text } from 'drizzle-orm/pg-core';

interface RequestEvent {
    cookies: {
        get: (name: string) => string | undefined;
        set: (name: string, value: string, options: {
            httpOnly: boolean;
            domain: string;
            sameSite: 'none';
            path: string;
            expires: Date;
        }) => void;
    };
}

export namespace Session {
    export const Session = new Struct({
        database: DB,
        name: 'Session',
        structure: {
            accountId: text('account_id').notNull(),
            ip: text('ip').notNull(),
            userAgent: text('user_agent').notNull(),
            requests: integer('requests').notNull(),
            prevUrl: text('prev_url').notNull(),
        },
    });

    export type SessionData = typeof Session.sample;

    export const getSession = (event: RequestEvent) => {
        return attemptAsync(async () => {
            const id = event.cookies.get('ssid');

            const create = async () => {
                const session = (await Session.new({
                    accountId: '',
                    ip: '',
                    userAgent: '',
                    requests: 0,
                    prevUrl: '',
                })).unwrap();

                event.cookies.set('ssid', session.id, {
                    httpOnly: true,
                    domain: DOMAIN,
                    sameSite: 'none',
                    path: '/*',
                    expires: new Date(Date.now() + SESSION_DURATION),
                });

                return session;
            };

            if (!id) {
                return create();
            }

            const s = (await Session.fromId(id)).unwrap();

            if (!s) {
                return create();
            }

            return s;
        });
    };
}
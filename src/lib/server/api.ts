import { attemptAsync } from "ts-utils/check";
import { API_KEY, API_DOMAIN } from "$env/static/private";
import { EventEmitter } from "ts-utils/event-emitter";
import type { Cookies } from "@sveltejs/kit";

class RequestError extends Error {
    constructor(public message: string, public url: string, public body: unknown) {
        super(`Url: ${url}\nBody: ${JSON.stringify(body, null, 4)}\nError: ${message}`);
        this.name = 'StreamError';
    }
}

export const fetchFromApi = async <T = unknown>(url: string, body: unknown) => {
    if (!url.startsWith('/')) url = '/' + url;
    return attemptAsync(async () => {
        return fetch(API_DOMAIN + url, {
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            method: 'POST',
        }).then(res => res.json() as Promise<T>)
        .catch(err => {
            throw new RequestError(err.message, url, body);
        });
    });
};

export const streamFromApi = async <T = unknown>(url: string, body: unknown) => {
    const em = new EventEmitter<{
        data: T;
        error: RequestError;
        end: void;
    }>();

    if (!url.startsWith('/')) url = '/' + url;

    // const controller = new AbortController();

    fetch(API_DOMAIN + url, {
        headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        method: 'POST',
        // signal: controller.signal,
    }).then(async res => {
        if (!res.body) {
            em.emit('end', undefined);
            return;
        }

        const reader = res.body.getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                em.emit('end', undefined);
                break;
            }
            const data = JSON.parse(new TextDecoder().decode(value)) as T;
            em.emit('data', data);
        }
    }).catch(err => {
        em.emit('error', new RequestError(err.message, url, body));
    });
}


export const getSession = async (cookies: Cookies) => {
    return attemptAsync(async () => {
    });
};

export const getAccount = async () => {
    return attemptAsync(async () => {
        
    });
};
/* eslint-disable @typescript-eslint/no-explicit-any */
import { attemptAsync } from "$lib/ts-utils/check";
import { EventEmitter } from "$lib/ts-utils/event-emitter";
import { match } from "$lib/ts-utils/match";
import { Stream } from "$lib/ts-utils/stream";
import { decode } from "$lib/ts-utils/text";
import { DataAction, PropertyAction } from '$lib/types';
import type { Writable } from "svelte/store";

export interface Socket {
    on(event: string, lisener: (data: unknown) => void): void;
}

export type ColType = 'string' | 'number' | 'boolean' | 'array' | 'json' | 'date' | 'bigint' | 'custom' | 'buffer';

export type ColTsType<t extends ColType> = t extends 'string' ? string :
    t extends 'number' ? number :
    t extends 'boolean' ? boolean :
    t extends 'array' ? unknown[] :
    t extends 'json' ? unknown :
    t extends 'date' ? Date :
    t extends 'bigint' ? bigint :
    t extends 'custom' ? unknown :
    t extends 'buffer' ? Buffer :
    never;

export type Blank = Record<string, ColType>;

export type StructBuilder<T extends Blank> = {
    name: string;
    structure: T;
    socket: Socket;
};

export type Structable<T extends Blank> = Partial<{
    [K in keyof T]: ColTsType<T[K]>;
}>

export class StructData<T extends Blank> implements Writable<Structable<T>> {
    constructor(public readonly struct: Struct<T>, public data: Structable<T>) {}

    private subscribers = new Set<(value: Structable<T>) => void>();

    public subscribe(fn: (value: Structable<T>) => void): () => void {
        this.subscribers.add(fn);
        fn(this.data);
        return () => {
            this.subscribers.delete(fn);
        };
    }

    // this is what will set in the store
    public set(value: Structable<T>): void {
        this.data = value;
        this.subscribers.forEach((fn) => fn(value));
    }

    // this is what will send to the backend
    public update(fn: (value: Structable<T>) => Structable<T>): void {
        this.struct.post(PropertyAction.Update, fn(this.data));
    }
}

export class DataArr<T extends Blank> implements Writable<StructData<T>[]> {
    constructor(public readonly struct: Struct<T>, public data: StructData<T>[]) {}

    private subscribers = new Set<(value: StructData<T>[]) => void>();

    public subscribe(fn: (value: StructData<T>[]) => void): () => void {
        this.subscribers.add(fn);
        fn(this.data);
        return () => {
            this.subscribers.delete(fn);
        };
    }

    public set(value: StructData<T>[]): void {
        this.data = value;
        this.subscribers.forEach((fn) => fn(value));
    }

    public update(fn: (value: StructData<T>[]) => StructData<T>[]): void {
        this.set(fn(this.data));
    }

    public add(...values: StructData<T>[]): void {
        this.set([...this.data, ...values]);
    }

    public remove(...values: StructData<T>[]): void {
        this.set(this.data.filter((value) => !values.includes(value)));
    }
}

export class StructStream<T extends Blank> extends Stream<StructData<T>> {
    constructor(public readonly struct: Struct<T>) {
        super();
    }
}

export type StructEvents<T extends Blank> = {
    new: StructData<T>;
    update: StructData<T>;
    delete: StructData<T>;
    archive: StructData<T>;
    restore: StructData<T>;
};

type ReadTypes = {
    all: void;
    archived: void;
    property: {
        key: string;
        value: unknown;
    };
    universe: string;
}

export class Struct<T extends Blank> {
    public static route = '/api';

    public static readonly structs = new Map<string, Struct<Blank>>();

    private readonly writables = new Map<string, DataArr<T>>();

    private readonly emitter = new EventEmitter<StructEvents<T>>();

    public on = this.emitter.on.bind(this.emitter);
    public off = this.emitter.off.bind(this.emitter);
    public once = this.emitter.once.bind(this.emitter);
    public emit = this.emitter.emit.bind(this.emitter);

    private readonly cache = new Map<string, StructData<T>>();

    constructor(public readonly data: StructBuilder<T>) {
        Struct.structs.set(data.name, this as any);

        data.socket.on(`struct:${data.name}`, (data) => {
            if (typeof data !== 'object' || data === null) {
                return console.error('Invalid data:', data);
            }
            if (!Object.hasOwn(data, 'event')) {
                return console.error('Invalid event:', data);
            }
            if (!Object.hasOwn(data, 'data')) {
                return console.error('Invalid data:', data);
            }
            const { event, data: structData } = data as { 
                event: 'create' | 'update' | 'archive' | 'delete' | 'restore'; 
                data: Structable<T>; 
            };

            if (!Object.hasOwn(structData, 'id')) {
                return console.error('Unable to identify data:', structData, 'No id provided');
            }

            const id = structData.id as string;
            
            match(event)
                .case('archive', () => {
                    const d = this.cache.get(id);
                    if (d) {
                        d.set({
                            ...d.data,
                            archived: true,
                        });
                        this.emit('archive', d);
                    }
                })
                .case('create', () => {
                    const exists = this.cache.get(id);
                    if (exists) return;
                    const d = new StructData(this, structData);
                    this.cache.set(id, d);
                    this.emit('new', d);
                })
                .case('delete', () => {
                    const d = this.cache.get(id);
                    if (d) {
                        this.cache.delete(id);
                        this.emit('delete', d);
                    }
                })
                .case('restore', () => {
                    const d = this.cache.get(id);
                    if (d) {
                        d.set({
                            ...d.data,
                            archived: false,
                        });
                        this.emit('restore', d);
                    }
                })
                .case('update', () => {
                    const d = this.cache.get(id);
                    if (d) {
                        d.set(structData);
                        this.emit('update', d);
                    }
                })
                .default(() => console.error('Invalid event:', event))
                .exec();
        });
    }

    Generator(data: Structable<T>): StructData<T> {
        // TODO: Data validation
        const d = new StructData(this, data);
        
        if (Object.hasOwn(data, 'id')) {
            this.cache.set(data.id as string, d);
        }

        return d;
    }

    // validate(data: unknown): data is Structable<T> {
        
    // }


    post(action: DataAction | PropertyAction, data: unknown) {
        return attemptAsync(async () => {
            return fetch('/struct', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    struct: this.data.name,
                    action,
                    data,
                }),
            });
        });
    }

    private getStream<K extends keyof ReadTypes>(type: K, data: ReadTypes[K]): StructStream<T> {
        const s = new StructStream(this);
        this.post(PropertyAction.Read, {
            type,
            data,
        }).then((res) => {
            const reader = res.unwrap().body?.getReader();
            if (!reader) {
                return;
            }

            let buffer = '';

            reader.read().then(({ done, value }) => {
                const text = new TextDecoder().decode(value);
                const chunks = text.split('\n\n');

                if (buffer) {
                    chunks[0] = buffer + chunks[0];
                    buffer = '';
                }

                if (!text.endsWith('\n\n')) {
                    buffer = chunks.pop() || '';
                }

                for (const chunk of chunks) {
                    const data = JSON.parse(decode(chunk));
                    s.add(this.Generator(data));
                }

                if (done) s.end();
            });
        });
        return s;
    }

    all(asStream: true): StructStream<T>;
    all(asStream: false): DataArr<T>;
    all(asStream: boolean) {
        const getStream = () => this.getStream('all', undefined);
        if (asStream) return getStream();
        const arr = this.writables.get('all');
        if (arr) return arr;
        const newArr = new DataArr(this, []);
        this.writables.set('all', newArr);
        getStream().pipe((d) => {
            newArr.add(d);
        });
        return newArr;
    }

    archived(asStream: true): StructStream<T>;
    archived(asStream: false): DataArr<T>;
    archived(asStream: boolean) {
        const getStream = () => this.getStream('archived', undefined);
        if (asStream) return getStream();
        const arr = this.writables.get('archived');
        if (arr) return arr;
        const newArr = new DataArr(this, []);
        this.writables.set('archived', newArr);
        getStream().pipe((d) => {
            newArr.add(d);
        });
        return newArr;
    }

    fromProperty(key: string, value: unknown, asStream: true): StructStream<T>;
    fromProperty(key: string, value: unknown, asStream: false): DataArr<T>;
    fromProperty(key: string, value: unknown, asStream: boolean) {
        const s = this.getStream('property', { key, value });
        if (asStream) return s;
        const arr = this.writables.get(`property:${key}:${JSON.stringify(value)}`) || new DataArr(this, []);
        this.writables.set(`property:${key}:${JSON.stringify(value)}`, arr);
        s.pipe((d) => {
            arr.add(d);
        });
        return arr;
    }

    fromUniverse(universe: string, asStream: true): StructStream<T>;
    fromUniverse(universe: string, asStream: false): DataArr<T>;
    fromUniverse(universe: string, asStream: boolean) {
        const s = this.getStream('universe', universe);
        if (asStream) return s;
        const arr = this.writables.get(`universe:${universe}`) || new DataArr(this, []);
        this.writables.set(`universe:${universe}`, arr);
        s.pipe((d) => {
            arr.add(d);
        });
        return arr;
    }
};

// const s = new Struct({
//     name: 'test',
//     structure: {
//         name: 'string',
//         age: 'number',
//     },
//     socket: {
//         on(event, listener) {
//             console.log(event, listener);
//         },
//     },
// });
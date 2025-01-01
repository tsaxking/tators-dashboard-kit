/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client, /*Server,*/ type ClientEvents } from './tcp';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { attemptAsync } from '../../ts-utils/check';
import { decode, encode } from '../../ts-utils/text';
import { lock } from 'proper-lockfile';
import { EventEmitter } from '../../ts-utils/event-emitter';
import { type Blank, Struct, type Structable } from '../struct';
// import { Webhook } from '../structs/webhook';
type StructEvents<T extends Blank> = {
    'archive': { timestamp: number; data: { id: string } };
    'build': { timestamp: number; data: { struct: string; } };
    'create': { timestamp: number; data: Structable<T> };
    'delete': { timestamp: number; data: { id: string; }};
    'delete-version': { timestamp: number; data: { vhId: string; id: string; } };
    'restore': { timestamp: number; data: { id: string; } };
    'restore-version': { timestamp: number; data: { vhId: string; id: string; } };
    'update': { timestamp: number; data: Partial<Structable<T>> };
};
class EventFileManager {
    private static streams: Map<string, fs.WriteStream> = new Map();

    static getStream(filePath: string): fs.WriteStream {
        if (!this.streams.has(filePath)) {
            const stream = fs.createWriteStream(filePath, { flags: 'a' });
            this.streams.set(filePath, stream);

            stream.on('close', () => {
                this.streams.delete(filePath);
            });
        }
        return this.streams.get(filePath)!;
    }

    static closeStream(filePath: string) {
        const stream = this.streams.get(filePath);
        if (stream) {
            stream.close();
            this.streams.delete(filePath);
        }
    }
}

// export class ServerAPI {
//     private readonly eventFilePath: string;

//     constructor(
//         public readonly server: Server,
//         public readonly apiKey: string
//     ) {
//         this.eventFilePath = path.join(__dirname, 'api', `${this.apiKey}.eventstream`);
//     }

//     public async init() {
//         return attemptAsync(async () => {
//             await fs.promises.mkdir(path.join(__dirname, 'api'), { recursive: true });
//             await fs.promises.writeFile(this.eventFilePath, '', { flag: 'a' });

//             this.listen('connect', async (data) => {
//                 const apiKey = data.data;
//                 const info = await Webhook.get(apiKey);
//                 if (info.isErr()) return console.error(info);

//                 if (!info.value) {
//                     return this.send('invalid-api-key', undefined, Date.now());
//                 }

//                 this.replayEvents();
//             });
//             this.listen('struct', async (data) => {
//                 const info = (await Webhook.get(this.apiKey)).unwrap();
//                 if (!info) return console.error('Webhook not found');

//                 if (info.permissions.some(p => p.data.struct === data.data.struct && p.data.permission === data.data.event)) {
//                     const emitter = this.structEmitters.get(data.data.struct);
//                     if (emitter) {
//                         emitter.emit(data.data.event as keyof StructEvents<Blank>, {
//                             data: data.data,
//                             timestamp: data.timestamp,
//                         });
//                     }
//                 } else {
//                     console.error('Permission denied');
//                 }
//             });
//         });
//     }

//     listen<T extends keyof Events>(event: T, cb: (data: { data: Events[T]; timestamp: number; }) => void, zod?: z.ZodType<Events[T]>) {
//         this.server.listenTo(this.apiKey, event, cb, zod);
//     }

//     async send(event: string, data?: unknown, timestamp?: number) {
//         const state = this.server.getState(this.apiKey);
//         if (state !== 'connected') {
//             this.writeEventToFile(event, data, timestamp || Date.now());
//             return;
//         }
//         this.server.sendTo(this.apiKey, event, data, timestamp || Date.now());
//     }

//     private async writeEventToFile(event: string, data: unknown, timestamp: number) {
//         const lockRelease = await lock(this.eventFilePath);
//         try {
//             const stream = EventFileManager.getStream(this.eventFilePath);
//             stream.write(encode(JSON.stringify({ event, data, timestamp }) + '\n'));
//         } catch (err) {
//             console.error('Failed to write event to file:', err);
//         } finally {
//             await lockRelease();
//         }
//     }

//     private async replayEvents() {
//         const lockRelease = await lock(this.eventFilePath);

//         try {
//             const fileContent = await fs.promises.readFile(this.eventFilePath, 'utf-8');
//             const lines = fileContent.split('\n').filter(Boolean);
//             const unprocessedEvents: string[] = [];
//             for (const line of lines) {
//                 try {
//                     const parsed = JSON.parse(decode(line));
//                     const event = z.object({ event: z.string(), data: z.any(), timestamp: z.number() }).parse(parsed);
//                     this.send(event.event, event.data, event.timestamp);
//                 } catch (err) {
//                     console.error('Failed to process event:', err);
//                     unprocessedEvents.push(line);
//                 }
//             }

//             // Rewrite file with unprocessed events
//             await fs.promises.writeFile(this.eventFilePath, unprocessedEvents.join('\n') + '\n', 'utf-8');
//         } catch (err) {
//             console.error('Error replaying events:', err);
//         } finally {
//             await lockRelease();
//         }
//     }
//     private structEmitters: Map<string, EventEmitter<StructEvents<Blank>>> = new Map();

//     createEmitter<S extends Struct>(struct: S) {
//         const em = new EventEmitter<StructEvents<S['data']['structure']>>();
//         if (!!this.structEmitters.get(struct.name)) {
//             throw new Error(`Emitter for struct ${struct.name} already exists`);
//         }
//         this.structEmitters.set(struct.name, em);
//         return em;
//     }
// }



export class ClientAPI {
    private readonly eventFilePath: string;

    constructor(
        public readonly client: Client,  // Use Client instead of Server
        public readonly apiKey: string
    ) {
        this.eventFilePath = path.join(__dirname, 'api', `${this.apiKey}.eventstream`);
    }

    public async init() {
        return attemptAsync(async () => {
            await fs.promises.mkdir(path.join(__dirname, 'api'), { recursive: true });
            await fs.promises.writeFile(this.eventFilePath, '', { flag: 'a' });

            this.listen('connect', () => {
                this.replayEvents();
            });

            this.listen('struct', (data) => {
                try {
                    const emitter = this.structEmitters.get(data.data.struct);
                    if (emitter) {
                        let obj: any;
                        switch (data.data.event) {
                            case 'archive':
                            case 'restore':
                            case 'delete':
                                obj = z.object({ id: z.string() }).parse(data.data);
                                break;
                            case 'build':
                                obj = z.object({ struct: z.string() }).parse(data.data);
                                break;
                            case 'create':
                            case 'update':
                                obj = data.data; // will be validated by the struct
                                break;
                            case 'restore-version':
                            case 'delete-version':
                                obj = z.object({ vhId: z.string(), id: z.string() }).parse(data.data);
                                break;
                            default:
                                throw new Error(`Unknown struct event: ${data}`);
                        }
                        emitter.emit(data.data.event as any, obj);
                    }
                } catch (error) {
                    console.error(error);
                }
            });
        });
    }

    listen<T extends keyof ClientEvents>(event: T, cb: (data: {data: ClientEvents[T]; timestamp: number;}) => void, zod?: z.ZodType<ClientEvents[T]>) {
        this.client.listen(event, cb, zod);
    }

    async send(event: string, data?: unknown, timestamp?: number) {
        const state = this.client.connected ? 'connected' : 'disconnected';  // Use `client.connected` directly
        if (state !== 'connected') {
            this.writeEventToFile(event, data, timestamp || Date.now());
            return;
        }
        this.client.send(event, data, timestamp || Date.now());
    }

    private async writeEventToFile(event: string, data: unknown, timestamp: number) {
        const lockRelease = await lock(this.eventFilePath);
        try {
            const stream = EventFileManager.getStream(this.eventFilePath);
            stream.write(encode(JSON.stringify({ event, data, timestamp }) + '\n'));
        } catch (err) {
            console.error('Failed to write event to file:', err);
        } finally {
            await lockRelease();
        }
    }

    private async replayEvents() {
        const lockRelease = await lock(this.eventFilePath);

        try {
            const fileContent = await fs.promises.readFile(this.eventFilePath, 'utf-8');
            const lines = fileContent.split('\n').filter(Boolean);
            const unprocessedEvents: string[] = [];

            for (const line of lines) {
                try {
                    const parsed = JSON.parse(decode(line));
                    const event = z.object({ event: z.string(), data: z.any(), timestamp: z.number() }).parse(parsed);
                    this.send(event.event, event.data, event.timestamp);
                } catch (err) {
                    console.error('Failed to process event:', err);
                    unprocessedEvents.push(line);
                }
            }

            // Rewrite file with unprocessed events
            await fs.promises.writeFile(this.eventFilePath, unprocessedEvents.join('\n') + '\n', 'utf-8');
        } catch (err) {
            console.error('Error replaying events:', err);
        } finally {
            await lockRelease();
        }
    }

    private readonly structEmitters: Map<string, EventEmitter<StructEvents<Blank>>> = new Map();

    createEmitter<S extends Struct>(struct: S) {
        const em = new EventEmitter<StructEvents<S['data']['structure']>>();
        if (this.structEmitters.get(struct.name)) {
            throw new Error(`Emitter for struct ${struct.name} already exists`);
        }
        this.structEmitters.set(struct.name, em);
        return em;
    }
}

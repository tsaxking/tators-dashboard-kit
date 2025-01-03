import { attempt } from 'ts-utils/src/check';
import type { RequestEvent } from '../../../routes/sse/$types';
import { Session } from '../structs/session';
import { encode } from 'ts-utils/src/text';
import { EventEmitter, SimpleEventEmitter } from 'ts-utils/src/event-emitter';

type Stream = ReadableStreamDefaultController<string>;

export class Connection {
	public readonly sessionId: string;

	private readonly emitter = new SimpleEventEmitter<'connect' | 'destroy' | 'close'>();

	private index = -1;
	private readonly interval: NodeJS.Timeout;

	private cache: {
		event: string;
		data: unknown;
		id: number;
		date: number;
	}[] = [];

	public on = this.emitter.on.bind(this.emitter);
	public off = this.emitter.off.bind(this.emitter);
	public once = this.emitter.once.bind;
	private emit = this.emitter.emit.bind(this.emitter);

	constructor(
		private readonly controller: Stream,
		session: Session.SessionData
	) {
		this.sessionId = session.id;

		this.interval = setInterval(() => {
			this.controller.enqueue(':keep-alive\n\n');
			this.send('ping', null).unwrap();

			const now = Date.now();
			const cache = this.cache.filter((e) => now - e.date < 10000);
			for (const { event, data, date } of cache) {
				// if it has not acknoledged a ping after 20 seconds, the connection is dead
				if (now - date > 20000 && event === 'ping') {
					return this.close();
				}
				this.send(event, data);
			}
		}, 10000);
	}

	send(event: string, data: unknown) {
		return attempt(() => {
			this.controller.enqueue(
				`data: ${encode(JSON.stringify({ event, data, id: this.index++ }))}\n\n`
			);
			this.cache.push({ event, data, id: this.index, date: Date.now() });
			return this.index;
		});
	}

	close() {
		this.send('close', null);
		this.controller.close();
		this.emit('close');
	}

	getSession() {
		return Session.Session.fromId(this.sessionId);
	}

	ack(id: number) {
		this.cache = this.cache.filter((e) => e.id > id);
	}
}

type Events = {
	connect: Connection;
	disconnect: Connection;
};

class SSE {
	public readonly connections = new Set<Connection>();

	private readonly emitter = new EventEmitter<Events>();

	public on = this.emitter.on.bind(this.emitter);
	public off = this.emitter.off.bind(this.emitter);
	public once = this.emitter.once.bind(this.emitter);
	private emit = this.emitter.emit.bind(this.emitter);

	constructor() {
		process.on('exit', () => {
			this.each((c) => c.close());
		});
	}

	connect(event: RequestEvent) {
		const me = this;
		return attempt(() => {
			let connection: Connection;
			return new ReadableStream({
				async start(controller) {
					const session = (await Session.getSession(event)).unwrap();
					connection = new Connection(controller, session);
					me.connections.add(connection);
					me.emit('connect', connection);
				},
				cancel() {
					if (connection) {
						me.emit('disconnect', connection);
						connection.close();
						me.connections.delete(connection);
					}
				}
			});
		});
	}

	send(
		event: string,
		data: unknown,
		condition?: (connection: Connection) => boolean | Promise<boolean>
	) {
		this.connections.forEach((connection) => {
			if (condition && !condition(connection)) return;
			connection.send(event, data);
		});
	}

	each(callback: (connection: Connection) => void) {
		this.connections.forEach(callback);
	}

	fromSession(sessionId: string) {
		return [...this.connections].find((connection) => connection.sessionId === sessionId);
	}
}

export const sse = new SSE();

import { attempt } from "$lib/ts-utils/check";
import type { RequestEvent } from "../../../routes/sse/$types";
import { Session } from "../structs/session";
import { encode } from "$lib/ts-utils/text";
import { EventEmitter, SimpleEventEmitter } from "$lib/ts-utils/event-emitter";

type Stream = ReadableStreamDefaultController<string>;

export class Connection {
	public readonly sessionId: string;

	private readonly emitter = new SimpleEventEmitter<'connect' | 'destroy' | 'close'>();

	private index = -1;

	public on = this.emitter.on.bind(this.emitter);
	public off = this.emitter.off.bind(this.emitter);
	public once = this.emitter.once.bind
	private emit = this.emitter.emit.bind(this.emitter);

	constructor(private readonly controller: Stream, session: Session.SessionData) {
		this.sessionId = session.id;
	}

	send(event: string, data: unknown) {
		return attempt(() => {
			this.controller.enqueue(`data: ${encode(JSON.stringify({ event, data, index: this.index++ }))}\n\n`);
		});
	}

	close() {
		this.controller.close();
		this.emit('close');
	}

	destroy() {
		// this.controller.error(new Error("Connection destroyed"));
		this.controller.close();
		this.emit('destroy');
	}

	getSession() {
		return Session.Session.fromId(this.sessionId);
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

	constructor() {}

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
						me.connections.delete(connection);
					}
				}
			});
		});
	}

	send(event: string, data: unknown, condition?: (connection: Connection) => boolean | Promise<boolean>) {
		this.connections.forEach((connection) => {
			if (condition && !condition(connection)) return;
			connection.send(event, data);
		});
	}

	each(callback: (connection: Connection) => void) {
		this.connections.forEach(callback);
	}
}

export const sse = new SSE();
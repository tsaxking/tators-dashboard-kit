import { browser } from '$app/environment';
import { EventEmitter } from 'ts-utils/event-emitter';
import { decode } from 'ts-utils/text';

class SSE {
	public readonly emitter = new EventEmitter();

	public on = this.emitter.on.bind(this.emitter);
	public off = this.emitter.off.bind(this.emitter);
	public once = this.emitter.once.bind(this.emitter);
	private emit = this.emitter.emit.bind(this.emitter);

	init(browser: boolean) {
		if (browser) {
			const connect = () => {
				const source = new EventSource('/sse');

				source.addEventListener('error', (e) => console.error('Error:', e));

				const onConnect = () => {
					this.emit('connect', undefined);
				};

				source.addEventListener('open', onConnect);

				let id = 0;

				const onMessage = (event: MessageEvent) => {
					// console.log('recieved:', event);
					try {
						const e = JSON.parse(decode(event.data));
						// console.log(e);
						if (e.id < id) return;
						id = e.id;
						console.log(e);
						if (!Object.hasOwn(e, 'event')) {
							return console.error('Invalid event:', e);
						}

						if (!Object.hasOwn(e, 'data')) {
							return console.error('Invalid data:', e);
						}

						if (e.event === 'close') {
							source.close();
						}

						if (!['close', 'ping'].includes(e.event)) this.emit(e.event, e.data);

						this.ack(e.id);
					} catch (error) {
						console.error(error);
					}
				};

				source.addEventListener('message', onMessage);

				const close = () => {
					source.close();
					source.removeEventListener('open', onConnect);
					source.removeEventListener('message', onMessage);
					source.removeEventListener('error', console.error);
				};

				window.addEventListener('beforeunload', close);

				return () => {
					close();
					window.removeEventListener('beforeunload', close);
				};
			};

			// let disconnect = connect();

			// // ping the server every 10 seconds, if the server does not respond, reconnect
			// setInterval(async () => {
			// 	if (!(await this.ping())) {
			// 		disconnect();
			// 		disconnect = connect();
			// 	}
			// }, 10000);
			connect();
		}
	}

	private ack(id: number) {
		fetch(`/sse/ack/${id}`);
	}

	private ping() {
		return fetch('/sse/ping').then((res) => res.ok);
	}
}

export const sse = new SSE();

sse.init(browser);

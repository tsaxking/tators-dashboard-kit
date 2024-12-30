import { browser } from "$app/environment";
import { EventEmitter } from "$lib/ts-utils/event-emitter";
import { decode } from "$lib/ts-utils/text";

class SSE {
    public readonly emitter = new EventEmitter();

    public on = this.emitter.on.bind(this.emitter);
    public off = this.emitter.off.bind(this.emitter);
    public once = this.emitter.once.bind(this.emitter);
    private emit = this.emitter.emit.bind(this.emitter);

    init(browser: boolean) {
        if (browser) {
            const source = new EventSource('/sse');

            source.addEventListener('error', console.error);

            source.addEventListener('open', () => {
                this.emit('connect', undefined);
            });

            source.addEventListener('message', (event) => {
                try {
                    const e = JSON.parse(decode(event.data));
                    if (!Object.hasOwn(e, 'event')) {
                        return console.error('Invalid event:', e);
                    }
    
                    if (!Object.hasOwn(e, 'data')) {
                        return console.error('Invalid data:', e);
                    }
    
                    this.emit(e.event, e.data);
                } catch (error) {
                    console.error(error);
                }
            });

            window.addEventListener('beforeunload', () => {
                source.close();
            });
        }
    }
}


export const sse = new SSE();

sse.init(browser);
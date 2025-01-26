import { Struct } from 'drizzle-struct/front-end';
import { sse } from '../utils/sse';

export namespace Potato {
    export const Friend = new Struct({
        name: 'potato_friend',
        structure: {
            account: 'string',
            level: 'number',
            name: 'string',
            lastClicked: 'string',
        },
        socket: sse
    });
}
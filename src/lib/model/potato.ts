import { Struct, type DataArr, type StructData } from 'drizzle-struct/front-end';
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

    export type FriendData = StructData<typeof Friend.data.structure>;
    export type FriendArr = DataArr<typeof Friend.data.structure>;
}
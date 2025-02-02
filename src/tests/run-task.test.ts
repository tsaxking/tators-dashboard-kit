import { describe, it, expect } from 'vitest';
import { runTs, runTask } from '$lib/server/utils/task';

describe('Run a typescript file', () => {
	it('Will run /scripts/index.ts', async () => {
        const res = await runTs('/scripts/index.ts', 'test', 'hello');
        if (res.isErr()) {
            throw res.error;
        } 
        if (res.isOk()) {
            expect(res.value).toBe('hello');
        }
	});
});


describe('Run a command', () => {
    it('Will run git status', async () => {
        const res = await runTask('git', ['status']);
        res.on('data', (data) => {
            console.log(data);
        });
        res.on('error', (error) => {
            console.error(error);
        });
        res.on('end', (code) => {
            expect(code).toBe(0);
        });
    });
});
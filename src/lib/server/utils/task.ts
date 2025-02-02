import { attemptAsync } from "ts-utils/check";
import { spawn } from 'child_process';
import path from 'path';
import * as tsNode from 'ts-node';
import { EventEmitter } from "ts-utils/event-emitter";
<<<<<<< Updated upstream
import { pathToFileURL } from 'url';
import { createRequire } from 'module';
=======
>>>>>>> Stashed changes


export const runTask = async (command: string, args: string[], config?: Partial<{
    timeout: number;
    log: boolean;
}>) => {
    const em = new EventEmitter<{
        data: string;
        error: Error;
        end: number;
    }>();
    try {
        const child = spawn(command, args, {
            stdio: 'pipe',
            cwd: path.resolve(process.cwd()),
        });
        if (config?.timeout) {
            setTimeout(() => {
                child.kill();
                if (config?.log) console.error('Task timeout');
            }, config.timeout);
        }
        child.stdout.on('data', (data) => {
            em.emit('data', data.toString());
            if (config?.log) console.log(data.toString());
        });
        child.stderr.on('data', (data) => {
            em.emit('error', new Error(data.toString()));
            if (config?.log) console.error(data.toString());
        });
        child.on('close', (code) => {
            if (code === 0) {
                em.emit('end', code);
            } else {
                if (config?.log) console.error(`Task failed with code ${code}`);
                em.emit('end', code ?? 1);
            }
        });
    } catch (error) {
        em.emit('error', error as Error);
    }
    return em;
};

export const runTs = async (file: string, fn: string, ...params: unknown[]) => {
    return attemptAsync(async () => {
        tsNode.register({
            transpileOnly: true,
        });
        const mod = await import(path.resolve(process.cwd(), file));
        const func = mod[fn];
        if (!func) {
            throw new Error(`Function ${fn} not found in ${file}`);
        }
        if (typeof func !== 'function') {
            throw new Error(`${fn} is not a function`);
        }
        return (await func(...params));
    });
<<<<<<< Updated upstream
};
=======
}
>>>>>>> Stashed changes

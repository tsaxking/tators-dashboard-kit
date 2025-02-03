import path from 'path';
import { runTs } from '../src/lib/server/utils/task';

// Convert import.meta.url to a file path

const main = async () => {
    const [,, file, ...rest] = process.argv;

    if (!file) {
        console.error('No file provided');
        process.exit(0);
    }

    const res = await runTs(path.join('scripts', file), 'main', ...rest);

    if (res.isErr()) {
        console.error(res.error);
        process.exit(1);
    }

    if (res.isOk()) {
        console.log(res.value);
        process.exit(0);
    }
};

// Vite-specific check: is this the entry module?

if (!globalThis.__vite_node_entry || globalThis.__vite_node_entry === import.meta.url) {
    main();
}

import path from 'path';
import { runTs } from '../src/lib/server/utils/task';
import terminal from '../src/lib/server/utils/terminal';

// Convert import.meta.url to a file path

const main = async () => {
	const [, , file, ...rest] = process.argv;

	if (!file) {
		terminal.error('No file provided');
		process.exit(0);
	}

	const res = await runTs(path.join('scripts', file), 'default', ...rest);

	if (res.isErr()) {
		terminal.error(res.error);
		process.exit(1);
	}

	if (res.isOk()) {
		terminal.log(res.value);
		process.exit(0);
	}
};

// Vite-specific check: is this the entry module?

if (!globalThis.__vite_node_entry || globalThis.__vite_node_entry === import.meta.url) {
	main();
}

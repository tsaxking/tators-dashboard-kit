import fs from 'fs';
import path from 'path';

const readFile = (file: string) => fs.promises.readFile(path.resolve(process.cwd(), file), 'utf-8');

const saveFile = (file: string, data: string) =>
	fs.promises.writeFile(path.resolve(process.cwd(), file), data);

export default async (name: string) => {
	if (!name) throw new Error('No name provided');
	let readme = await readFile('./README.md');
	readme = readme.replaceAll('tsaxking/sveltekit-template', name);
	await saveFile('./README.md', readme);
	process.exit(0);
};

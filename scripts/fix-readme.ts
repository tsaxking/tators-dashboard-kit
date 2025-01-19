import fs from 'fs';
import path from 'path';


const [, , arg] = process.argv;
if (!arg) throw new Error('No argument provided');


const readFile = (file: string) => fs.promises.readFile(
    path.resolve(process.cwd(), file),
    'utf-8'
);

const saveFile = (file: string, data: string) => fs.promises.writeFile(
    path.resolve(process.cwd(), file),
    data,
);

const main = async () => {
    let readme = await readFile('./README.md');
    readme = readme.replaceAll('tsaxking/sveltekit-template', arg);
    await saveFile('./README.md', readme);
    process.exit(0);
};
main();

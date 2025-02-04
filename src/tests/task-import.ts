import terminal from '../lib/server/utils/terminal';

// Used for the run-task.test.ts unit test
export const test = (str: string) => {
	terminal.log(str);
	return str;
};

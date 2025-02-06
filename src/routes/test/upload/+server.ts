import { FileReceiver } from '$lib/server/utils/files.js';
import { error } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';
import terminal from '$lib/server/utils/terminal';

export const POST = async (event) => {
	terminal.log('Received file upload request');

	const fr = new FileReceiver({
		maxFiles: 1,
		maxFileSize: 1 * 1024 * 1024
	});

	const res = await fr.receive(event);
	if (res.isErr()) {
		terminal.error(res.error);
		return error(ServerCode.internalServerError, 'Failed to receive file');
	}

	return new Response(
		JSON.stringify({
			fileId: res.value.files[0].filePath
		}),
		{
			headers: {
				'Content-Type': 'application/json'
			},
			status: 200
		}
	);
};

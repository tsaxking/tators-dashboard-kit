import { Struct } from 'drizzle-struct/back-end';
import { z } from 'zod';
import { Test } from '$lib/server/structs/testing';
import { DB } from '$lib/server/db/index.js';
import { handleEvent, connectionEmitter } from '$lib/server/event-handler.js';

if (!Test.Test.built) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Test.Test.build(DB as any).then((res) => {
		console.log(res);
		if (res.isErr()) {
			console.error(res.error);
		}
	});
	Test.Test.eventHandler(handleEvent(Test.Test));
	// TODO: make this base on .env?
	Test.Test.bypass('*', () => true);
	connectionEmitter(Test.Test);
}

export const POST = async (event) => {
	const data = await event.request.json();
	try {
		const typed = z
			.object({
				name: z.string(),
				structure: z.record(z.string())
			})
			.parse(data);

		const struct = Struct.structs.get(typed.name);
		if (!struct)
			return new Response(
				JSON.stringify({
					success: false,
					message: 'Struct not found'
				}),
				{ status: 200 }
			);

		for (const [k, v] of Object.entries(struct.data.structure)) {
			if (!typed.structure[k])
				return new Response(
					JSON.stringify({
						success: false,
						message: `Missing key ${k}`
					}),
					{ status: 400 }
				);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if (typed.structure[k] !== (v as any).config.dataType)
				return new Response(
					JSON.stringify({
						success: false,
						message: `Error: invalid type for key ${k}`
					}),
					{ status: 400 }
				);
		}
	} catch (error) {
		console.error(error);
		return new Response(
			JSON.stringify({
				success: false,
				message: 'Invalid struct data'
			}),
			{ status: 200 }
		);
	}

	return new Response(
		JSON.stringify({
			success: true,
			message: 'Struct exists and is valid'
		}),
		{ status: 200 }
	);
};

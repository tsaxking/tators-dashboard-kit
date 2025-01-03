import { Struct } from 'drizzle-struct/back-end';

export const POST = async (event) => {
	const res = await Struct.handler(event);
	if (res.isErr()) {
		console.error(res.error);
		return new Response('Error', { status: 500 });
	}
	return res.value;
};

import { sse } from '$lib/server/utils/sse';

// setInterval(() => {
// 	sse.send({
// 		data: JSON.stringify({ text: `Hello: ${crypto.randomUUID()}` })
// 	});
// }, 1000);

export async function GET(event) {
	const body = sse.connect(event);
	if (body.isErr()) {
		console.error(body.error);
		return new Response('Server Error', {
			status: 500
		});
	}

	const headers = {
		'cache-control': 'no-store',
		'content-type': 'text/event-stream'
	};

	return new Response(body.value, { headers });
}

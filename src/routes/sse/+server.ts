import sse from '$lib/server/utils/sse';

setInterval(() => {
	sse.send({
		data: JSON.stringify({ text: `Hello: ${crypto.randomUUID()}` })
	});
}, 1000);

export const GET = async () => {
	const body = sse.connect();

	const headers = {
		'cache-control': 'no-store',
		'content-type': 'text/event-stream'
	};

	return new Response(body, { headers });
}
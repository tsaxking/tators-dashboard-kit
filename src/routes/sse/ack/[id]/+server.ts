import { sse } from '$lib/server/utils/sse';

export const GET = async (event) => {
	const id = event.params.id;
	const ssid = event.cookies.get('ssid');
	if (!ssid) {
		return new Response('No Session Id', {
			status: 401
		});
	}

	const connection = sse.fromSession(ssid);
	if (!connection) {
		return new Response('No Connection', {
			status: 401
		});
	}

	connection.ack(+id);
};

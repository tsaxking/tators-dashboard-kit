function create_message_string(message: Record<string, unknown>) {
	return (
		Object.entries(message)
			.map(([key, value]) => `${key}: ${value}`)
			.join('\n') + '\n\n'
	);
}

type Stream = ReadableStreamDefaultController<string>

function create_sse_manager() {
	const connections = new Set<Stream>();

	return {
		connect() {
			let _controller: Stream;

			return new ReadableStream({
				start(controller) {
					_controller = controller;
					connections.add(_controller);
				},
				cancel() {
					connections.delete(_controller);
				}
			});
		},
		send(message_obj: Record<string, unknown>) {
			const message_string = create_message_string(message_obj);
			connections.forEach((controller) => controller.enqueue(message_string));
		}
	};
}

const sse_manager = create_sse_manager();

export default sse_manager;
import { expect, test } from 'vitest';
import { Client, Server } from 'drizzle-struct/tcp';
import { z } from 'zod';

test('TCP', async () => {
	const server = new Server('localhost', 3333);

	const client = new Client('localhost', 3333, 'apiKey');

	server.start();

	client.listen(
		'test',
		({ data }) => {
			console.log(data);
			expect(data.test).toBe('test');
		},
		z.object({
			test: z.string()
		})
	);

	server.listenTo(
		'test',
		'test',
		({ data }) => {
			console.log(data);
			expect(data.test).toBe('test');
			server.sendTo(
				'test',
				'test',
				{
					test: 'test'
				},
				Date.now()
			);
		},
		z.object({
			test: z.string()
		})
	);

	client.send(
		'test',
		{
			test: 'test'
		},
		Date.now()
	);
});

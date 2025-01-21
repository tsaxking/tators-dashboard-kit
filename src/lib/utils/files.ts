import { attemptAsync } from 'ts-utils/check';
import { EventEmitter } from 'ts-utils/event-emitter';
import { z } from 'zod';

export class FileUploader {
	constructor(
		public readonly endpoint: string,
		public readonly config: {
			method: 'POST' | 'GET' | 'DELETE';
			headers?: Record<string, string>;
			body?: unknown;
		}
	) {}

	sendFile(file: File, fieldName: string) {
		return attemptAsync(async () => {
			const xhr = new XMLHttpRequest();

			const emitter = new EventEmitter<{
				load: string;
				error: string;
			}>();

			// Handle successful upload
			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					emitter.emit(
						'load',
						z
							.object({
								fileId: z.string()
							})
							.parse(JSON.parse(xhr.responseText)).fileId
					);
				} else {
					emitter.emit('error', 'Failed to upload file.');
				}
			};

			// Handle upload error
			xhr.onerror = () => {
				emitter.emit('error', 'Failed to upload file.');
			};

            xhr.setRequestHeader('Content-Type', 'multipart/form-data');
            // xhr.setRequestHeader('Content-Disposition', `inline; filename="${file.name}"`);

			// Open and send the request
			xhr.open(this.config.method, this.endpoint);
			const formData = new FormData();
			formData.append(fieldName, file, file.name);
			xhr.send(formData);

			// Provide abort method
			return {
				on: emitter.on.bind(emitter),
				abort: () => xhr.abort()
			};
		});
	}
}

import path from 'path';
import fs from 'fs';
import { attemptAsync } from 'ts-utils/check';
import { uuid } from './uuid';

const UPLOAD_DIR = path.resolve(process.cwd(), 'static/uploads');

// Ensure the upload directory exists
fs.promises.mkdir(UPLOAD_DIR, { recursive: true }).catch(() => {});

interface RequestEvent {
	request: Request;
}

export class FileReceiver {
	constructor(
		public readonly config: {
			maxFileSize: number; // In bytes
			maxFiles: number;    // Maximum number of files allowed
		}
	) {}

	async receive({ request }: RequestEvent) {
		return attemptAsync(async () => {
			const contentType = request.headers.get('content-type');
			if (!contentType || !contentType.startsWith('multipart/form-data')) {
				throw new Error('Invalid content type. Expected multipart/form-data.');
			}

			// Extract the boundary string from the content type
			const boundary = contentType.split('boundary=')[1];
			if (!boundary) {
				throw new Error('Boundary not found in content type.');
			}

			const reader = request.body?.getReader();
			if (!reader) {
				throw new Error('Request body is missing.');
			}

			const decoder = new TextDecoder();
			let buffer = '';
			const files: { fieldName: string; filePath: string }[] = [];
			let fileStream: fs.WriteStream | null = null;
			let currentFilePath = '';
			let currentFieldName = '';
			let fileCount = 0;
			let currentFileSize = 0;

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });

				// Split buffer on boundaries
				const parts = buffer.split(`--${boundary}`);

				for (let i = 0; i < parts.length - 1; i++) {
					const part = parts[i].trim();

					// Handle file headers and data
					if (part.includes('Content-Disposition: form-data;')) {
						// Parse headers
						const headerMatch = part.match(/name="(.+?)"(?:; filename="(.+?)")?/);
						if (headerMatch) {
							currentFieldName = headerMatch[1];
							const originalFileName = headerMatch[2];

							// If this is a file, prepare to write it
							if (originalFileName) {
								if (fileCount >= this.config.maxFiles) {
									throw new Error(
										`Exceeded the maximum allowed number of files: ${this.config.maxFiles}`
									);
								}

								currentFilePath = path.join(UPLOAD_DIR, `${uuid()}_${originalFileName}`);
								fileStream = fs.createWriteStream(currentFilePath);
								fileCount++;
								currentFileSize = 0; // Reset for the new file
							}
						}
					} else if (fileStream) {
						const chunk = Buffer.from(part, 'binary');
						currentFileSize += chunk.length;

						// Check max file size
						if (currentFileSize > this.config.maxFileSize) {
							fileStream.close();
							fs.promises.unlink(currentFilePath).catch(() => {});
							throw new Error(
								`File exceeds the maximum allowed size of ${this.config.maxFileSize} bytes.`
							);
						}

						// Write file data
						fileStream.write(chunk);
					}
				}

				// Check if we need to reset the buffer
				buffer = parts[parts.length - 1].trim();
			}

			// Close the last file stream if open
			if (fileStream) {
				fileStream.end();
				files.push({ fieldName: currentFieldName, filePath: currentFilePath });
			}

			return { files };
		});
	}
}

declare module 'svelte-filepond' {
	import { SvelteComponentTyped } from 'svelte';
	import { FilePondOptions } from 'filepond';

	type FilePondEvent = (error: Error, file: FilePondFile) => void;

	interface FilePondFile {
		file: File;
		fileExtension: string;
		fileSize: number;
		fileType: string;
		filename: string;
		metadata: Record<string, unknown>;
		id: string;
		origin: string;
		status: string;
	}

	export interface FilePondProps extends FilePondOptions {
		// FilePond properties
		name?: string;
		allowMultiple?: boolean;
		server?: string | FilePondOptions['server'];
		files?: FilePondFile[];

		// Event Handlers
		oninit?: () => void;
		onaddfile?: FilePondEvent;
		onremovefile?: FilePondEvent;
		onprocessfile?: FilePondEvent;
		onupdatefiles?: (files: FilePondFile[]) => void;

		// Bind this for Svelte component
		bind_this?: (value: unknown) => void;
	}

	export default class FilePond extends SvelteComponentTyped<FilePondProps> {}

	export function registerPlugin(...plugins: unknown[]): void;
	export function supported(): boolean;
}

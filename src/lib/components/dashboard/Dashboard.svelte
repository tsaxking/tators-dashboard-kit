<script lang="ts">
	import { capitalize } from 'ts-utils/text';
	import type { Snippet } from 'svelte';
	import MinimizedCards from './MinimizedCards.svelte';

	interface Props {
		title: string;
		body: Snippet;
	}

	const { title, body }: Props = $props();
</script>

<div>
	<h1>{capitalize(title)}</h1>
	<MinimizedCards />
	{@render body()}
</div>

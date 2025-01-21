<script lang="ts">
	import Navbar from '$lib/components/general/Navbar.svelte';
	import { PUBLIC_APP_NAME } from '$env/static/public';
	import { onMount } from 'svelte';
	import { capitalize } from 'ts-utils/text';

	const { children } = $props();

	let name = $state('');

	onMount(() => {
		[, , name] = location.pathname.split('/');
	});
</script>

<main class="dashboard">
	<Navbar title={PUBLIC_APP_NAME} />

	<h1>{capitalize(name)}</h1>
	{@render children()}
</main>

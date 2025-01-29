<script>
	import { Struct } from 'drizzle-struct/front-end';
	
	setTimeout(() => {
		Struct.buildAll();
	});
	const { children } = $props();
</script>

<main>
	{@render children()}
</main>

<script lang="ts">
	const { data } = $props();
	const event = data.event;
	const teams = data.teams;
	const matches = data.matches;
</script>

<pre>
    <!-- {JSON.stringify(event, null, 4)} -->
    <!-- {JSON.stringify(teams, null, 4)} -->
    {JSON.stringify(matches, null, 4)}
</pre>

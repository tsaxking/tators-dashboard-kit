<script lang="ts">
	import type { TBAMatch } from 'tatorscout/tba';

	interface Props {
		matches: TBAMatch[];
		onSelect?: (match: TBAMatch) => void;
		selected: TBAMatch;
	}

	let { matches, onSelect, selected = $bindable() }: Props = $props();
</script>

<select
	onchange={(event) => {
		const matchKey = event.currentTarget.value;
		const match = matches.find((match) => match.key === matchKey);
		if (match) {
			onSelect?.(match);
		}
	}}
>
	<option value="" selected disabled>Select a match</option>
	{#each matches as match}
		<option value={match.key}>{match.key}</option>
	{/each}
</select>

<script lang="ts">
	import type { TBATeam } from 'tatorscout-utils/tba';

	interface Props {
		teams: TBATeam[];
		onSelect?: (match: TBATeam) => void;
		selected: TBATeam;
	}

	let { teams, onSelect, selected = $bindable() }: Props = $props();
</script>

<select
	onchange={(event) => {
		const teamKey = event.currentTarget.value;
		const team = teams.find((team) => team.key === teamKey);
		if (team) {
			onSelect?.(team);
			selected = team;
		}
	}}
>
	<option value="" selected disabled>Select a team</option>
	{#each teams as team}
		<option value={team.key}>{team.key}</option>
	{/each}
</select>

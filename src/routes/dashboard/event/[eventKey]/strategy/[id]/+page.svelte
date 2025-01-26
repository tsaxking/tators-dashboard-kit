<script lang="ts">
	import MatchSelect from "$lib/components/FIRST/MatchSelect.svelte";
	import type { Strategy } from "$lib/model/strategy";
	import { onMount } from "svelte";
	import type { TBAMatch, TBATeam } from "tatorscout-utils/tba";

    interface Props {
        matches: TBAMatch[];
        teams: TBATeam[];
    }

    const data: {
        data: Props;
    } = $props();

    const { matches, teams } = data.data;

    let selectedMatch: TBAMatch | undefined = $state(undefined);
</script>


<div class="container-fluid">
    <div class="row">
        <div class="col-md-3">
            <MatchSelect {matches} selected={selectedMatch}/>
        </div>
    </div>
    {#if selectedMatch}
    {/if}
</div>
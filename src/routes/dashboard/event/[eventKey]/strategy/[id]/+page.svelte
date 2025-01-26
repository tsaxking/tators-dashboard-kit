<script lang="ts">
	import type { Strategy } from "$lib/model/strategy";
	import { onMount } from "svelte";
	import type { TBAMatch } from "tatorscout-utils/tba";

    interface Props {
        matches: TBAMatch[];
    }
</script>
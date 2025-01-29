<script lang="ts">
	import { Permissions } from "$lib/model/permissions";
	import { onMount } from "svelte";

    interface Props {
        role: Permissions.RoleData;
    }

    const { role }: Props = $props();

    onMount(() => {});
</script>
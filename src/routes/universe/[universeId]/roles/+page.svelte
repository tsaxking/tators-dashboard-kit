<script lang="ts">
    import { Universes } from "$lib/model/universe";
    import { Permissions } from "$lib/model/permissions";

    const { data } = $props();
    const { universe } = data;

    const members = Universes.getMembers(universe);
</script>
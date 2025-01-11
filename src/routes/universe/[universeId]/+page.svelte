<script lang="ts">
    const { data } = $props();
    const universe = data.universe;
</script>


{#if universe}
{:else}
    <p>Universe not found</p>
{/if}
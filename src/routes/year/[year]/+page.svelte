<script lang="ts">
    import Card from '$lib/components/bootstrap/Card.svelte';
    const { data } = $props();
    const events = data.events;
</script>

{#each events as event} 
    <a href="/dashboard/event/{event.key}">
        <Card 
            title={event.name}
        >
            {#snippet body()}
                <p>{event.year}</p>
            {/snippet}
        </Card>
    </a>
{/each}
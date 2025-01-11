<script lang="ts">
	import Card from "$lib/components/bootstrap/Card.svelte";
	import { Account } from "$lib/model/account";
    import { Universes } from "$lib/model/universe";
	import { DataArr } from "drizzle-struct/front-end";
	import { onMount } from "svelte";

    const { data } = $props();
    const universes = data.universes;
    const current = data.current;

    const self = Account.getSelf();

    let invites = $state(new DataArr(Universes.UniverseInvite, []));
    let publicUniverses = $state(new DataArr(Universes.Universe, []));

    onMount(() => {
        invites = Universes.UniverseInvite.fromProperty('account', $self.data.id, false);
        publicUniverses = Universes.Universe.fromProperty('public', true, false);
    });

</script>

<div class="container">
    <div class="row mb-3">
        <div class="col-12">
            <h1>Universes</h1>
        </div>
    </div>
    <div class="row mb-3">
        <div class="col-md-6">
            <Card
                title="My Invites"
                glowColor="secondary"
            >
            {#snippet body()} 
                {#if $invites.length} 
                {:else}
                    <p>No pending invites</p>
                    {/if}
            {/snippet}
            </Card>
        </div>
    </div>
</div>
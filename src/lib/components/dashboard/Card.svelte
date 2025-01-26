<script lang="ts">
	import type { Snippet } from "svelte";
    import { capitalize } from "ts-utils/text";
    import { Dashboard } from "$lib/model/dashboard-cards";

    interface Props {
        body: Snippet;
        card: Dashboard.Card;
    };

    let { body, card }: Props = $props();
</script>


{#if $card.show}
    <div class="card" class:maximized={$card.maximized}>
        <div class="card-header">
            <div class="d-flex h-100 align-items-center">
                <h5 class="card-title h-100 m-0">
                    <div class="d-flex align-items-center h-100">
                        {#if card.config.iconType === 'bi'}
                            <i class="bi bi-{card.config.icon}"></i>
                        {:else if card.config.iconType === 'fa'}
                            <i class="fa fa-{card.config.icon}"></i>
                        {:else if card.config.iconType === 'material-icons'}
                            <i class="material-icons">{card.config.icon}</i>
                        {/if}
                        <span class="ms-2">
                            {capitalize(card.config.name)}
                        </span>
                    </div>
                </h5>
                <div class="ms-auto">
                    <button class="btn btn-sm" onclick={() => card.update(c => ({
                        ...c,
                        show: !c.show,
                    }))} aria-label="Close">
                        {#if $card.show} 
                            <i class="material-icons">close</i>
                        {:else}
                            <i class="material-icons">open_in_full</i>
                        {/if}
                    </button>
                    <button class="btn btn-sm" onclick={() => card.update(c => ({
                        ...c,
                        maximized: !c.maximized,
                    }))} aria-label="Maximize">
                        {#if $card.maximized} 
                            <i class="material-icons">close_fullscreen</i>
                        {:else}
                            <i class="material-icons">open_in_full</i>
                        {/if}
                    </button>
                </div>
            </div>
        </div>
        <div class="card-body">
            {@render body()}
        </div>
    </div>
{/if}

<style>
    .card {
        transition: all 0.3s ease;
    }

    .maximized {
        position: fixed;
        height: 80%;
        width: 80%;
        top: 10%;
        left: 10%;
        z-index: 1000;
    }
</style>
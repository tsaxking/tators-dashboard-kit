<script lang="ts">
	import { Account } from "$lib/model/account";
	import type { BootstrapColor } from "colors/color";
	import Card from "../bootstrap/Card.svelte";

    interface Props {
        notification: Account.AccountNotificationData;
    }

    const { notification }: Props = $props();
</script>


<Card 
    title={$notification.title || 'Notification'}
    glowColor={$notification.severity as BootstrapColor || 'primary'}
>
    {#snippet body()}
        <p>{$notification.message || ''}</p>
        <button type="button" class="btn btn-outline-danger" onclick={() => notification.delete()}>
            <i class="material-icons">
                delete
            </i>
        </button>
        <button type="button" class="btn btn-outline-primary" onclick={() => notification.update(n => ({
            ...n,
            read: !n.read,
        }))}>
            <i class="material-icons">
                {#if $notification.read}
                    mark_email_read
                {:else}
                    mark_as_unread
                {/if}
            </i>
        </button>
    {/snippet}
</Card>
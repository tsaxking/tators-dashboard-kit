<script lang="ts">
	import { Account } from '$lib/model/account';
	import type { BootstrapColor } from 'colors/color';
	import Card from '../bootstrap/Card.svelte';

	interface Props {
		notification: Account.AccountNotificationData;
	}

	const { notification }: Props = $props();

	const glowColor = $notification.read ? $notification.severity : undefined;
	const color = $notification.read ? undefined : $notification.severity;
</script>

<Card
	title={$notification.title || 'Notification'}
	glowColor={glowColor as BootstrapColor}
	color={color as BootstrapColor}
>
	{#snippet body()}
		<p>{$notification.message || ''}</p>
		<button type="button" class="btn btn-outline-dark" onclick={() => notification.delete()}>
			<i class="material-icons"> delete </i>
		</button>
		<button
			type="button"
			class="btn btn-outline-dark"
			onclick={() =>
				notification.update((n) => ({
					...n,
					read: !n.read
				}))}
		>
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

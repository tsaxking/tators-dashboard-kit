<script lang="ts">
	import { browser } from '$app/environment';
	import { Account } from '$lib/model/account';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import Notification from '../account/Notification.svelte';

	const id = 'notifications';

	interface Props {
		notifs: number;
	}

	let limit = $state(10);
	let page = $state(0);
	let { notifs = $bindable() }: Props = $props();

	let notifications = $state(
		new DataArr(Account.AccountNotification, [
			// Account.AccountNotification.Generator({
			// 	accountId: 'string',
			// 	title: 'string',
			// 	severity: 'danger',
			// 	message: 'string',
			// 	icon: 'string',
			// 	link: 'string',
			// 	read: false,
			//     id: 'string',
			//     created: 'string',
			//     updated: 'string',
			//     archived: false,
			//     universes: 'string',
			//     attributes: 'string',
			//     lifetime: 0,
			// })
		])
	);

	onMount(() => {
		notifications = Account.getNotifs(limit, page);
	});

	$effect(() => {
		if (browser) {
			notifications = Account.getNotifs(limit, page);
			notifs = $notifications.filter((n) => !n.data.read).length;
		}
	});
</script>

<div class="offcanvas offcanvas-end" tabindex="-1" {id} aria-labelledby="{id}Label">
	<div class="offcanvas-header">
		<h5 class="offcanvas-title" id="{id}Label">My Notifications</h5>
		<button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
	</div>
	<div class="offcanvas-body">
		<ul class="list-unstyled">
			{#each $notifications as notification}
				<Notification {notification} />
			{/each}
		</ul>
	</div>
</div>

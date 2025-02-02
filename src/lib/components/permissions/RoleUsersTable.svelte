<script lang="ts">
	import { Permissions } from '$lib/model/permissions';
	import { onMount } from 'svelte';
	import { Account } from '$lib/model/account';
	import { DataArr } from 'drizzle-struct/front-end';

	interface Props {
		role: Permissions.RoleData;
	}

	const { role }: Props = $props();

	let users = $state(new DataArr(Account.Account, []));

	onMount(() => {
		users = Permissions.usersFromRole(role);
	});
</script>

<table class="table table-striped">
	<thead>
		<tr>
			<th>Username</th>
			<th>Full Name</th>
			<th>Email</th>
		</tr>
	</thead>
	<tbody>
		{#each $users as user}
			<tr>
				<td>{user.data.username}</td>
				<td>{user.data.firstName} {user.data.lastName}</td>
				<td>{user.data.email}</td>
			</tr>
		{/each}
	</tbody>
</table>

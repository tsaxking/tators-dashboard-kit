<script lang="ts">
	// import { prompt } from '$lib/utils/prompts.js';
	import { Form } from '$lib/utils/form.js';
	import { Universes } from '$lib/model/universe.js';
	import { DataArr } from 'drizzle-struct/front-end';
	import { Account } from '$lib/model/account.js';
	import { onMount } from 'svelte';
	import { Permissions } from '$lib/model/permissions.js';
	// import { Account } from '$lib/model/account.js';

	const { data } = $props();
	const universe = data.universe;
	let members = $state(new DataArr(Account.Account, []));
	let roles = $state(new DataArr(Permissions.Role, []));

	// const self = Account.getSelf();

	const invite = async () => {
		// const user = await prompt('Enter username or email', {
		// 	title: 'Invite user'
		// });

		// if (!user) return;

		const res = await new Form(
			`?/invite`,
			'POST',
		)
			.input('user', {
				label: 'Username or email',
				required: true,
				type: 'text',
				// options: {
				// 	datalist: async (value) => {

				// 	},
				// }
			})
			.prompt({
				title: 'Invite user',
				send: true,
			});
};

onMount(() => {
	members = Universes.getMembers(universe);
	roles = Universes.getRoles(universe);
});
</script>

<div class="container">
	<div class="row">
		<div class="col-12">
			<div class="d-flex w-100 justify-content-between">
				<h1>{$universe.name}</h1>
				<button type="button" class="btn" onclick={invite}>
					<i class="material-icons">
						person_add
					</i>
				</button>
			</div>
		</div>
	</div>
	<div class="row">
		<div class="col-md-6">
			<h2>Members</h2>
			<ul>
				{#each $members as member}
					<li>{member.data.username}</li>
				{/each}
			</ul>
		</div>
		<div class="col-md-6">
			<h2>Roles <a href="/universe/{$universe.id}/roles" style="text-decoration: none;">
				<i class="material-icons">
					edit
				</i>
			</a></h2>
			<ul>
				{#each $roles as role}
					<li>{role.data.name}</li>
				{/each}
			</ul>
		</div>
	</div>
</div>
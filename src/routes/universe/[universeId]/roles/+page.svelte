<script lang="ts">
	import { Universes } from '$lib/model/universe';
	import { Permissions } from '$lib/model/permissions';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import { Form } from '$lib/utils/form.js';
	import { alert, confirm } from '$lib/utils/prompts.js';
	import Modal from '$lib/components/bootstrap/Modal.svelte';
	import RoleEditor from '$lib/components/permissions/RoleEditor.svelte';
	import RoleUsersTable from '$lib/components/permissions/RoleUsersTable.svelte';

	const { data } = $props();
	const { universe } = data;
	Universes.setUniverse(universe.data.id || '');
	let currentRole: Permissions.RoleData | undefined = $state(undefined);

	let roles = $state(new DataArr(Permissions.Role, []));

	onMount(() => {
		roles = Universes.getRoles(universe);
	});

	const edit = (role: Permissions.RoleData) => {
		currentRole = undefined;
		setTimeout(() => {
			currentRole = role;
			console.log(currentRole.data.entitlements);
			editModal.show();
		});
	};

	const remove = async (role: Permissions.RoleData) => {
		if (await confirm(`Are you sure you want to delete ${role.data.name}?`)) {
			role.delete();
		}
	};

	const add = async () => {
		const data = await new Form()
			.input('name', {
				type: 'text',
				label: 'Role name',
				required: true
			})
			.input('description', {
				type: 'text',
				label: 'Role description',
				required: true
			})
			.prompt({
				title: 'Add Role',
				send: false
			});

		if (data.isOk()) {
			const { name, description } = data.value.value;
			Permissions.Role.new({
				name,
				description,
				// universe: universe.data.id,
				links: 'Can I put anything here?',
				entitlements: 'I should not put permissions here'
			});
		}
	};

	let editModal: Modal;
	let userModal: Modal;
	let roleEditor: RoleEditor | undefined = $state(undefined);
</script>

<div class="container">
	<div class="row">
		<div class="col-12">
			<h1>{$universe.name}</h1>
		</div>
	</div>
	<div class="row">
		<div class="col-12">
			<div class="table-responsive">
				<button type="button" class="btn btn-primary" onclick={add}>
					<i class="material-icons"> group_add </i>
				</button>
				<table class="table table-striped">
					<tbody>
						{#each $roles as role}
							{#if role.data.canUpdate}
								<tr>
									<td class="text-primary">{role.data.name}</td>
									<td><small>{role.data.description}</small></td>
									<td>
										<button type="button" class="btn btn-primary" onclick={() => edit(role)}>
											<i class="material-icons"> edit </i>
										</button>
										<button type="button" class="btn btn-danger" onclick={() => remove(role)}>
											<i class="material-icons"> group_remove </i>
										</button>
										<button
											type="button"
											class="btn btn-secondary"
											onclick={() => {
												currentRole = role;
												userModal.show();
											}}
										>
											<i class="material-icons"> manage_accounts </i>
										</button>
									</td>
								</tr>
							{:else}
								<tr>
									<td class="text-secondary">{role.data.name}</td>
									<td><small>{role.data.description}</small></td>
									<td>
										<em>Cannot change</em>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>

<Modal bind:this={editModal} title="Edit Role: {currentRole?.data.name}" size="lg">
	{#snippet body()}
		{#if currentRole}
			<RoleEditor bind:this={roleEditor} role={currentRole} />
		{:else}
			<p>No role selected</p>
		{/if}
	{/snippet}
	{#snippet buttons()}
		<button
			type="button"
			class="btn btn-primary"
			onclick={() => {
				if (roleEditor) roleEditor.save();
				editModal?.hide();
			}}
		>
			Save
		</button>
		<button
			type="button"
			class="btn btn-secondary"
			onclick={() => {
				if (roleEditor) roleEditor.reset();
			}}
		>
			Reset
		</button>
		<button
			type="button"
			class="btn btn-secondary"
			onclick={() => {
				editModal.hide();
				currentRole = undefined;
			}}
		>
			Cancel
		</button>
	{/snippet}
</Modal>
<Modal bind:this={userModal} title="Manage Users" size="lg">
	{#snippet body()}
		{#if currentRole}
			<RoleUsersTable role={currentRole} />
		{:else}
			<p>No role selected</p>
		{/if}
	{/snippet}
	{#snippet buttons()}
		<button type="button" class="btn btn-secondary" onclick={() => userModal.hide()}>
			Close
		</button>
	{/snippet}
</Modal>

<script lang="ts">
	import { type Blank } from 'drizzle-struct/front-end';
	import { capitalize, fromCamelCase } from 'ts-utils/text';
	import { Permissions } from '../../model/permissions';
	import PropertyRow from './PropertyRow.svelte';

	interface Props {
		struct: Permissions.StructPermissions<Blank>;
	}

	const { struct }: Props = $props();
	const name = struct.struct.data.name;

	const selectRead = () => {
		struct.update((s) => {
			const on = s.properties.every((p) => p.data.read);
			if (on) {
				for (const property of s.properties) {
					property.data.read = false;
					property.data.update = false;
				}
				canUpdate = false;
				canRead = false;
			} else {
				for (const property of s.properties) {
					property.data.read = true;
				}
				canRead = true;
			}

			return s;
		});
	};
	const selectUpdate = () => {
		struct.update((s) => {
			const on = s.properties.every((p) => p.data.update);
			if (on) {
				for (const property of s.properties) {
					property.data.update = false;
				}
				canUpdate = false;
			} else {
				for (const property of s.properties) {
					property.data.update = true;
					property.data.read = true;
				}
				canUpdate = true;
				canRead = true;
			}

			return s;
		});
	};

	type State = boolean | 'indeterminate';

	let canRead: State = $state(false);
	let canUpdate: State = $state(false);

	$effect(() => {
		const someRead = $struct.properties.some((p) => p.data.read);
		const allRead = $struct.properties.every((p) => p.data.read);
		canRead = allRead ? true : someRead ? 'indeterminate' : false;

		const someUpdate = $struct.properties.some((p) => p.data.update);
		const allUpdate = $struct.properties.every((p) => p.data.update);
		canUpdate = allUpdate ? true : someUpdate ? 'indeterminate' : false;
	});
</script>

<div class="container-fluid">
	<div class="row mb-3">
		<table class="table">
			<tbody>
				<tr>
					<td>
						Read
					</td>
					<td>
						<div class="form-check">
							{#if typeof canRead === 'boolean'}
								<input
									id={struct.struct.data.name + '-read'}
									name={struct.struct.data.name + '-read'}
									class="form-check-input"
									checked={canRead}
									role="switch"
									type="checkbox"
									oninput={selectRead}
								/>
							{:else}
								<input
									id={struct.struct.data.name + '-read'}
									name={struct.struct.data.name + '-read'}
									class="form-check-input"
									checked={false}
									indeterminate={true}
									role="switch"
									type="checkbox"
									oninput={selectRead}
								/>
							{/if}
						</div>
					</td>
				</tr>
				<tr>
					<td>
						Update
					</td>
					<td>
						<div class="form-check">
							{#if typeof canUpdate === 'boolean'}
								<input
									id={struct.struct.data.name + '-update'}
									name={struct.struct.data.name + '-update'}
									class="form-check-input"
									checked={canUpdate}
									role="switch"
									type="checkbox"
									oninput={selectUpdate}
								/>
							{:else}
								<input
									id={struct.struct.data.name + '-update'}
									name={struct.struct.data.name + '-update'}
									class="form-check-input"
									checked={false}
									indeterminate={true}
									role="switch"
									type="checkbox"
									oninput={selectUpdate}
								/>
							{/if}
						</div>
					</td>
				</tr>
				<tr>
					<td>
						Create
					</td>
					<td>
						<div class="form-check form-switch">
							<input
								id="{name}-create"
								name="{name}-create"
								class="form-check-input"
								role="switch"
								type="checkbox"
								bind:checked={$struct.permissions.create}
								onchange={() =>
									struct.update((s) => {
										s.permissions.create = !s.permissions.create;
										return s;
									})}
							/>
						</div>
					</td>
				</tr>
				<tr>
					<td>
						Delete
					</td>
					<td>
						{#if $struct.permissions.create}
							<div class="form-check form-switch">
								<input
									id="{name}-delete"
									name="{name}-delete"
									class="form-check-input"
									role="switch"
									type="checkbox"
									bind:checked={$struct.permissions.delete}
									onchange={() =>
										struct.update((s) => {
											s.permissions.delete = !s.permissions.delete;
											return s;
										})}
								/>
							</div>
						{/if}
					</td>
				</tr>
				<tr>
					<td>
						Read Archive
					</td>
					<td>
						<div class="form-check form-switch">
							<input
								id="{name}-read-archive"
								name="{name}-read-archive"
								class="form-check-input"
								role="switch"
								type="checkbox"
								bind:checked={$struct.permissions['read-archive']}
								onchange={() =>
									struct.update((s) => {
										s.permissions['read-archive'] = !s.permissions['read-archive'];
										return s;
									})}
							/>
						</div>
					</td>
				</tr>
				<tr>
					<td>
						Archive / Restore
					</td>
					<td>
						{#if $struct.permissions['read-archive']}
							<div class="form-check form-switch">
								<input
									id="{name}-archive"
									name="{name}-archive"
									class="form-check-input"
									role="switch"
									type="checkbox"
									bind:checked={$struct.permissions.archive}
									onchange={() =>
										struct.update((s) => {
											s.permissions.archive = !s.permissions.archive;
											return s;
										})}
								/>
							</div>
						{/if}
					</td>
				</tr>
				<tr>
					<td>
						Read Version History
					</td>
					<td>
						<div class="form-check form-switch">
							<input
								id="{name}-read-version-history"
								name="{name}-read-version-history"
								class="form-check-input"
								role="switch"
								type="checkbox"
								bind:checked={$struct.permissions['read-version-history']}
								onchange={() =>
									struct.update((s) => {
										s.permissions['read-version-history'] = !s.permissions['read-version-history'];
										return s;
									})}
							/>
						</div>
					</td>
				</tr>
				<tr>
					<td>
						Restore Version
					</td>
					<td>
						{#if $struct.permissions['read-version-history']}
							<div class="form-check form-switch">
								<input
									id="{name}-restore-version"
									name="{name}-restore-version"
									class="form-check-input"
									role="switch"
									type="checkbox"
									bind:checked={$struct.permissions['restore-version']}
									onchange={() =>
										struct.update((s) => {
											s.permissions['restore-version'] = !s.permissions['restore-version'];
											return s;
										})}
								/>
							</div>
						{/if}
					</td>
				</tr>
				<tr>
					<td>
						Delete Version
					</td>
					<td>
						{#if $struct.permissions['read-version-history']}
							<div class="form-check form-switch">
								<input
									id="{name}-delete-version"
									name="{name}-delete-version"
									class="form-check-input"
									role="switch"
									type="checkbox"
									bind:checked={$struct.permissions['delete-version']}
									onchange={() =>
										struct.update((s) => {
											s.permissions['delete-version'] = !s.permissions['delete-version'];
											return s;
										})}
								/>
							</div>
						{/if}
					</td>
				</tr>
			</tbody>
		</table>
	</div>
	<div class="row">
		<div class="table-responsive">
			<table class="table">
				<thead>
					<tr>
						<th></th>
						<th class="rotate"><div><span>Read</span></div></th>
						<th class="rotate"><div><span>Update</span></div></th>
					</tr>
				</thead>
				<tbody>
					{#each $struct.properties as _, i}
						<PropertyRow struct={struct} bind:property={$struct.properties[i]} />
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

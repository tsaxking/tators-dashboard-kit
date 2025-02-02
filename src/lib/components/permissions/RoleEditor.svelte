<script lang="ts">
	import { type Blank } from 'drizzle-struct/front-end';
	import { capitalize, fromSnakeCase } from 'ts-utils/text';
	import { Permissions } from '$lib/model/permissions';
	import { confirm } from '$lib/utils/prompts';
	import { onMount } from 'svelte';

	interface Props {
		role: Permissions.RoleData;
	}

	const { role }: Props = $props();

	type S = {
		struct: string;
		permission: string[];
	};

	let entitlements: S[] = $state([]);

	let value = $state(new Set<string>());

	export const save = () => {
		Permissions.saveEntitlements(role, Array.from(value)).then((e) => {
			console.log(e);
		});
	};

	export const reset = () => {
		value = new Set(JSON.parse(role.data.entitlements ?? '[]'));
	};

	onMount(() => {
		Permissions.getEntitlements().then((e) => {
			if (e.isOk()) {
				entitlements = e.value.reduce((acc, ent) => {
					const has = acc.find((e) => e.struct === ent.struct);
					if (has) {
						has.permission.push(ent.name);
					} else {
						acc.push({
							struct: ent.struct,
							permission: [ent.name]
						});
					}
					return acc;
				}, [] as S[]);
			}
		});

		return role.subscribe((e) => {
			value = new Set(JSON.parse(e.entitlements ?? '[]'));
		});
	});
</script>

<div class="container">
	<div class="row">
		{#each entitlements as e, i}
			<h4>
				{e.struct}
			</h4>
			<ul class="list-unstyled">
				{#each e.permission as p}
					<li>
						<input
							type="checkbox"
							id="permission-{i}-{p}"
							onchange={(e) => {
								if (e.currentTarget.checked) {
									value.add(p);
								} else {
									value.delete(p);
								}
							}}
							checked={value.has(p)}
						/>
						<label for="permission-{i}-{p}" class="ms-2">
							{capitalize(fromSnakeCase(p, '-'))}
						</label>
					</li>
				{/each}
			</ul>
		{/each}
	</div>
</div>

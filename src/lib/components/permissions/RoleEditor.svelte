<script lang="ts">
	import { type Blank } from 'drizzle-struct/front-end';
	import { capitalize, fromSnakeCase } from 'ts-utils/text';
	import { Permissions } from '$lib/model/permissions';
	import { confirm } from '$lib/utils/prompts';
	import { onMount } from 'svelte';
	import { z } from 'zod';

	interface Props {
		role: Permissions.RoleData;
	}

	const { role }: Props = $props();

	type S = {
		group: string;
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
		try {
			value = new Set(z.array(z.string()).parse(JSON.parse(role.data.entitlements ?? '[]')));
		} catch (error) {
			console.error(error);
			value = new Set();
		}
	};

	onMount(() => {
		Permissions.getEntitlements().then((e) => {
			if (e.isOk()) {
				entitlements = e.value.reduce((acc, ent) => {
					const has = acc.find((e) => e.group === ent.group);
					if (has) {
						has.permission.push(ent.name);
					} else {
						acc.push({
							group: ent.group,
							permission: [ent.name]
						});
					}
					return acc;
				}, [] as S[]);
			}
		});

		return role.subscribe((e) => {
			try {
				value = new Set(z.array(z.string()).parse(JSON.parse(e.entitlements ?? '[]')));
			} catch (error) {
				console.error(error);
				value = new Set();
			}
		});
	});
</script>

<div class="container">
	<div class="row">
		{#each entitlements as e, i}
			<h4>
				{e.group}
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

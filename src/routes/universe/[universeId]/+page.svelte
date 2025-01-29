<script lang="ts">
	// import { prompt } from '$lib/utils/prompts.js';
	import { Form } from '$lib/utils/form.js';
	import { Universes } from '$lib/model/universe.js';
	// import { Account } from '$lib/model/account.js';

	const { data } = $props();
	const universe = data.universe;

	// const self = Account.getSelf();

	const invite = async () => {
		// const user = await prompt('Enter username or email', {
		// 	title: 'Invite user'
		// });

		// if (!user) return;

		const res = await new Form()
			.input('username', {
				label: 'Username or email',
				required: true,
				type: 'text',
			})
			.prompt('Invite user');

		if (res.isOk()) {

		}
};
</script>

<div class="container">
	<div class="row">
		<div class="col-12">
			<div class="d-flex w-100 justify-content-between">
				<h1>{$universe.name}</h1>
				<button type="button" class="btn" onclick={invite}>
					<i class="material-icons">
						group_add
					</i>
				</button>
			</div>
		</div>
	</div>
</div>
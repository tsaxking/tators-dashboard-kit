<script lang="ts">
	import Card from '$lib/components/dashboard/Card.svelte';
	import TeamComments from '$lib/components/robot-display/TeamComments.svelte';
	import { Dashboard } from '$lib/model/dashboard-cards';

	const card1 = new Dashboard.Card({
		name: 'Card 1',
		iconType: 'material-icons',
		icon: 'home',
		id: 'card1'
	});

	const card2 = new Dashboard.Card({
		name: 'Card 2',
		iconType: 'material-icons',
		icon: 'home',
		id: 'card2'
	});
</script>

<div class="container-fluid">
	<div class="row">
		<div class="col">
			<Card card={card1}>
				{#snippet body()}
					<h1>Card 1</h1>
					<p>This is the body of card 1</p>
				{/snippet}
			</Card>
			<Card card={card2}>
				{#snippet body()}
					<TeamComments />
				{/snippet}
			</Card>
		</div>
	</div>
</div>

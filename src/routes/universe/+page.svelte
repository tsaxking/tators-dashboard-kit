<script lang="ts">
	import Card from '$lib/components/bootstrap/Card.svelte';
	const { max, min } = Math;

	const { data } = $props();
	const universes = data.universes;
	const publicUniverses = data.publicUniverses;
	const invites = data.invites;

	const universePage = data.universePage;
	const invitePage = data.invitePage;
	const universeCount = data.universeCount;
	const inviteCount = data.inviteCount;
</script>

<div class="container">
	<div class="row mb-3">
		<div class="col-12">
			<h1>Universes</h1>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col-md-6 mb-5">
			<Card title="My Invites" glowColor="secondary">
				{#snippet body()}
					{#if invites.length > 0}
						<nav>
							<ul class="pagination">
								<li class="page-item">
									<a class="page-link" href="/universe/?invitePage=1">
										<span aria-hidden="true">«</span>
									</a>
								</li>
								{#if invitePage > 1}
									<li class="page-item">
										<a class="page-link" href="/universe/?invitePage={invitePage - 1}">
											<span aria-hidden="true">
												<i class="material-icons"> chevron_left </i>
											</span>
										</a>
									</li>
								{/if}
								{#if inviteCount > 1}
									{#each Array.from({ length: Math.min(5, inviteCount) }, (_, i) => i + Math.max(1, invitePage - 2)) as i}
										<li class="page-item">
											<a class="page-link" href="/universe/?invitePage={i}">
												{#if i === invitePage}
													<strong>{i + 1}</strong>
												{:else}
													{i + 1}
												{/if}
											</a>
										</li>
									{/each}
								{/if}

								{#if invitePage < inviteCount}
									<li class="page-item">
										<a class="page-link" href="/universe/?invitePage={invitePage + 1}">
											<span aria-hidden="true">
												<i class="material-icons"> chevron_right </i>
											</span>
										</a>
									</li>
								{/if}
							</ul>
						</nav>
					{:else}
						<p>No invites</p>
					{/if}
				{/snippet}
			</Card>
		</div>
		<div class="col-md-6 mb-5">
			<Card title="My Universes" glowColor="primary">
				{#snippet body()}
					{#if universes.length}
						<nav>
							<ul class="pagination">
								<li class="page-item">
									<a class="page-link" href="/universe/?universePage=1">
										<span aria-hidden="true">«</span>
									</a>
								</li>
								{#if universePage > 1}
									<li class="page-item">
										<a class="page-link" href="/universe/?universePage={universePage - 1}">
											<span aria-hidden="true">
												<i class="material-icons"> chevron_left </i>
											</span>
										</a>
									</li>
								{/if}
								{#if universeCount > 1}
									{#each Array.from({ length: Math.min(5, universeCount) }, (_, i) => i + Math.max(1, universePage - 2)) as i}
										<li class="page-item">
											<a class="page-link" href="/universe/?universePage={i}">
												{#if i === universePage}
													<strong>{i + 1}</strong>
												{:else}
													{i + 1}
												{/if}
											</a>
										</li>
									{/each}
								{/if}

								{#if universePage < universeCount}
									<li class="page-item">
										<a class="page-link" href="/universe/?universePage={universePage + 1}">
											<span aria-hidden="true">
												<i class="material-icons"> chevron_right </i>
											</span>
										</a>
									</li>
								{/if}
							</ul>
						</nav>
						<ul class="list-group">
							{#each universes as universe}
								<li class="list-group-item">
									<div class="d-flex justify-content-between">
										<div>
											<h5 class="mb-1">{universe.data.name}</h5>
											<p class="mb-1">{universe.data.description}</p>
										</div>
										<div>
											<a href="/universe/{universe.data.id}">
												<button class="btn btn-primary">View</button>
											</a>
										</div>
									</div>
								</li>
							{/each}
						</ul>
					{:else}
						<p>No universes</p>
					{/if}
				{/snippet}
			</Card>
		</div>
		<div class="col-md-6 mb-5">
			<Card title="Public Universes" glowColor="success">
				{#snippet body()}
					{#if publicUniverses.length}
						<ul class="list-group">
							{#each publicUniverses as universe}
								<li class="list-group-item">
									<div class="d-flex justify-content-between">
										<div>
											<h5 class="mb-1">{universe.data.name}</h5>
											<p class="mb-1">{universe.data.description}</p>
										</div>
										<div>
											<a href="/universe/{universe.data.id}">
												<button class="btn btn-primary">View</button>
											</a>
										</div>
									</div>
								</li>
							{/each}
						</ul>
					{:else}
						<p>No public universes</p>
					{/if}
				{/snippet}
			</Card>
		</div>
		<div class="col-md-6 mb-5">
			<Card title="Create Universe" glowColor="info">
				{#snippet body()}
					<form action="?/create" method="POST">
						<div class="mb-3">
							<label for="name" class="form-label">Name</label>
							<input type="text" class="form-control" id="name" name="name" required />
						</div>
						<div class="mb-3">
							<label for="description" class="form-label">Description</label>
							<textarea class="form-control" id="description" name="description" required
							></textarea>
						</div>
						<div class="mb-3">
							<input class="form-check-input" type="checkbox" id="public" name="public" checked />
							<label class="form-check-label" for="public">Public</label>
						</div>
						<div class="mb-3">
							<input
								class="form-check-input"
								type="checkbox"
								id="agree-tos"
								name="agree-tos"
								required
							/>
							<label for="agree-tos" class="form-check-label"
								>I agree to the <a href="/universe/terms-and-conditions">Terms and Conditions</a
								></label
							>
						</div>
						<button type="submit" class="btn btn-primary">Create</button>
					</form>
				{/snippet}
			</Card>
		</div>
	</div>
</div>

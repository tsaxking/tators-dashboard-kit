<script lang="ts">
    import Card from '$lib/components/bootstrap/Card.svelte';
    const { data } = $props();

    const { invite, universe } = data;
</script>

<div class="container">
    <div class="row">
        <div class="col-12">
            <h1 class="text-center">You have been invited to {$universe.name}</h1>
            <small class="text-muted">{$universe.description}</small>
        </div>
    </div>
    <div class="row">
        <div class="col-md-6">
            <Card 
                title="Accept"
                color="success"
            >
                {#snippet body()}
                    <form action="?/accept" method="POST">
                        <label for="submit">
                            By accepting this invite, you agree to the <a href="/universe/terms-and-conditions">Terms and Conditions</a> of the universe.
                        </label>
                        <button type="submit" class="btn btn-success">Accept</button>
                    </form>
                {/snippet}
            </Card>
        </div>
        <div class="col-md-6">
            <Card 
                title="Decline"
                color="danger"
            >
                {#snippet body()}
                    <form action="?/decline" method="POST">
                        <label for="submit">
                            By declining this invite, you will not be able to access the universe.
                        </label>
                        <button type="submit" class="btn btn-danger">Decline</button>
                    </form>
                {/snippet}
            </Card>
        </div>
    </div>
</div>
<script lang="ts">
    import Modal from "./bootstrap/Modal.svelte";

    let modal: Modal;

    const hide = () => {
        modal.hide();
    }
</script>

<Modal 
    bind:this={modal}
    title="Test Modal"
>
    {#snippet body()}
        <p>This is a test modal.</p>
    {/snippet}
    {#snippet buttons()}
        <button type="button" class="btn btn-primary" onclick={hide}>Close</button>
    {/snippet}
</Modal>

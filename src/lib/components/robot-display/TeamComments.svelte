<script lang="ts">
    import { FIRST } from "$lib/model/FIRST";
    import { Scouting } from "$lib/model/scouting";
    import 'datatables.net-dt';
	import { onMount } from "svelte";


    interface Props {
        comments: {
            account: string;
            type: string;
            comment: string;
            match: string;
        }[];
    };

    const { comments }: Props = $props();

    let table: HTMLTableElement;

    onMount(() => {
        jQuery(table).DataTable({
            data: comments,
        });
    });
</script>

<div class="table-responsive">
    <table class="table table-striped" bind:this={table}>
    </table>
</div>
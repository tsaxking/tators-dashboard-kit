<script lang="ts">
    import { FIRST } from '$lib/model/FIRST';

    interface Props {
        team: FIRST.TeamsData;
        pictures: FIRST.TeamPicturesArr;
    }

    const { team, pictures }: Props = $props();
</script>


<script lang="ts">
    import { Scouting } from '$lib/model/scouting';
    import { FIRST } from '$lib/model/FIRST';
	import { onMount } from 'svelte';
	import { MatchCanvas } from '$lib/model/match-canvas';

    interface Props {
        match: Scouting.MatchScoutingData;
        team: FIRST.TeamData;
        focus: 'auto' | 'teleop' | 'endgame' | undefined;
        year: number;
    }

    const { match, team, focus, year }: Props = $props();

    let canvas: HTMLCanvasElement;
    let matchCanvas: MatchCanvas;
    let stop = $state(() => {});

    onMount(() => {
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2d context');
        const pullTrace = match.pull('trace');
        if (!pullTrace) throw new Error('No trace data');

        matchCanvas = new MatchCanvas(
            JSON.parse(pullTrace.data.trace),
            year,
            ctx,
            {
                'amp': 'red',
                'bal': 'blue',
                'cbe': 'green',
                'clb': 'yellow',
                'cne': 'purble',
                'lob': 'orange',
                'nte': 'black',
                'pck': 'white',
                'spk': 'pink',
                'src': 'brown',
                'trp': 'cyan',
            }
        );

        stop = matchCanvas.animate();

        if (focus) {
            switch (focus) {
                case 'auto': 
                    matchCanvas.auto();
                    break;
                case 'teleop':
                    matchCanvas.teleop();
                    break;
                case 'endgame':
                    matchCanvas.endgame();
                    break;
            }
        } else {
            matchCanvas.reset();
        }

        return () => {
            stop();
        };
    });

</script>

<div class="container-fluid">
    <div class="row">
        <canvas bind:this={canvas} style:height="300px"></canvas>
    </div>
</div>
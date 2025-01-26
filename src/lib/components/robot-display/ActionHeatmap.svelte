<script lang="ts">
    import { Scouting } from '$lib/model/scouting';
    import { onMount } from 'svelte';
    import { type TraceArray } from 'tatorscout-utils/trace';
    import { MatchCanvas } from '$lib/model/match-canvas';

    interface Props {
        matches: Scouting.MatchScoutings;
        focus: 'auto' | 'teleop' | 'endgame' | undefined;
        year: number;
    }

    let actions: string[] = $state([]);
    
    export const getActions = () => actions;

    let { matches, focus, year }: Props = $props();

    let canvas: HTMLCanvasElement;

    let c: MatchCanvas;
    let array: TraceArray = $state([]);

    $effect(() => {
        c.between(0, array.length);
    });

    onMount(() => {
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2d context');
        c = new MatchCanvas(
            array,
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

        c.hidePath();

        actions = [];

        array = matches
            .data
            .map(m => m.data.trace)
            .filter(Boolean)
            // casted as string because sveltekit doesn't recognize filter(Boolean) as a type guard
            .map(t => {
                const arr = JSON.parse(t as string) as TraceArray;
                return arr.filter((p) => {
                    const [i,,, a] = p;
                    if (!a) return false;
                    if (!actions.includes(a)) {
                        actions.push(a);
                    }
                    if (focus) {
                        switch (focus) {
                            case 'auto':
                                return i < 20 * 4;
                            case 'teleop':
                                return i >= 20 * 4 && i < 20 * 4 + 135 * 4;
                            case 'endgame':
                                return i >= 20 * 4 + 135 * 4;
                        }
                    }
                    return true;
                });
            })
            .flat();

        const stop = c.animate();
        return stop;
    });
</script>


<canvas bind:this={canvas} style:height="300px"></canvas>
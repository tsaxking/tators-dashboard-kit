<script lang="ts">
	import type { FIRST } from "$lib/model/FIRST";
    import { type TBAMatch } from "tatorscout-utils/tba";
    import { dateTime } from "ts-utils/clock";
    import { Scouting } from "$lib/model/scouting";
	import { onMount } from "svelte";

    interface Props {
        team: FIRST.TeamData;
        matches: {
            tba: TBAMatch;
            scouting?: Scouting.MatchScoutingData;
        }[];
    }

    const { team, matches }: Props = $props();

    const generateMatchStr = (match: TBAMatch) => {
        if (match.comp_level === 'sf') {
            return `sf ${match.set_number}`;
        } else {
            return `${match.comp_level} ${match.match_number}`;
        }
    };

    const generateTime = (match: TBAMatch) => {
        if (match.actual_time) {
            return dateTime(match.actual_time * 1000);
        } else {
            return dateTime(match.time * 1000);
        }
    };

    const generateFlagColor = (match?: Scouting.MatchScoutingData) => {
        if (!match) return 'white';
        // TODO: Implement flag color
    };

    const generateFlagTitle = (match?: Scouting.MatchScoutingData) => {
        if (!match) return 'No Scouting data';
        // TODO: Parse checks
    };

    const generateStatus = (match: TBAMatch) => {
        if (!match.score_breakdown) {
            return 'Not Played';
        } else {
            const winning = match.winning_alliance;
            const alliance = match.alliances.red.team_keys.includes('frc' + team.data.number)
                ? 'red'
                : 'blue';
            return winning === alliance ? 'Win' : 'Loss';
        }
    };

    onMount(() => {
        import('bootstrap').then(bs => {
            table.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
                new bs.Tooltip(el);
            });
        });

        return () => {
            import('bootstrap').then(bs => {
                table.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
                    const tooltip = bs.Tooltip.getInstance(el);
                    if (tooltip) tooltip.dispose();
                });
            });
        };
    });

    let table: HTMLTableElement;
</script>

<div class="table-responsive">
    <table class="table table-striped table-hover" bind:this={table}>
        <thead>
            <tr>
                <th>Match</th>
                <th>Time</th>
                <th>Flag</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            {#each matches as match}
                <tr>
                    <td>{generateMatchStr(match.tba)}</td>
                    <td>{generateTime(match.tba)}</td>
                    <td>
                        <i 
                            class="material-icons"
                            style="color: {generateFlagColor(match.scouting)}"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="{generateFlagTitle(match.scouting)}"
                        >
                            flag
                        </i>
                    </td>
                    <td>{generateStatus(match.tba)}</td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
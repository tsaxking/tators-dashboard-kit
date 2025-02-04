<script lang="ts">
	import DateInput from "../forms/DateInput.svelte";


interface Props {
    rank: number;
    record: string;
    played: number;
    drivebase: string;
    weight: string;
    averageVelocity: string;
    averageSecondsNotMoving: string;
}

const {
    rank = 12,
    record = "6-2-1",
    played = 9,
    drivebase = 'some sort of text',
    weight = 'number then lbs',
    averageVelocity = 'number then ft/s',
    averageSecondsNotMoving = 'number then s'
}: Props = $props();

</script>
<table>
    <tbody>
        <tr>
            <td>Rank:</td>
            <td>{rank}</td>
        </tr>
        <tr>
            <td>Record:</td>
            <td>{record}</td>
        </tr>
        <tr>
            <td>Played:</td>
            <td>{played}</td>
        </tr>
        <tr>
            <td>Drivebase:</td>
            <td>{drivebase}</td>
        </tr>
        <tr>
            <td>Weight:</td>
            <td>{weight}</td>
        </tr>
        <tr>
            <td>Average Velocity:</td>
            <td>{averageVelocity}</td>
        </tr>
        <tr>
            <td>Average Seconds Not Moving:</td>
            <td>{averageSecondsNotMoving}</td>
        </tr>
    </tbody>
</table>
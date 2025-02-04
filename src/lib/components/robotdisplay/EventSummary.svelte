<script lang = "ts">
	import DateInput from "../forms/DateInput.svelte";


interface Data {
    rank: number;
    record: string;
    played: number;
    drivebase: string;
    weight: string;
    averageVelocity: string;
    averageSecondsNotMoving: string;
}

const data: Data = {
    rank: 12,
    record: "6-2-1",
    played: 9,
    drivebase: 'some sort of text',
    weight: 'number then lbs',
    averageVelocity: 'number then fts/s',
    averageSecondsNotMoving: 'number then s'
};


const Table: React.FC = () => {
    return (
        <table>
            <thead> Summary </thead>
            <tbody>
                <tr>
                    <td>Rank: {rank}</td>
                    <td>{data.rank}</td>
                </tr>
                <tr>
                    <td>Record: {record}</td>
                    <td>{data.record}</td>
                </tr>
                <tr>
                    <td>Played: {played}</td>
                    <td>{data.played}</td>
                </tr>
                <tr>
                    <td>Drivebase: {drivebase}</td>
                    <td>{data.drivebase}</td>
                </tr>
                <tr>
                    <td>Weight: {weight}</td>
                    <td>{data.weight}</td>
                </tr>
                <tr>
                    <td>Average Velocity: {averageVelocity}</td>
                    <td>{data.averageVelocity}</td>
                </tr>
                <tr>
                    <td>Average Seconds Not Moving: {averageSecondsNotMoving}</td>
                    <td>{data.averageSecondsNotMoving}</td>
                </tr>
            </tbody>
        </table>
    );
};

</script>
import { Struct, type StructData, type DataArr } from 'drizzle-struct/front-end';
import { sse } from '../utils/sse';
import { browser } from '$app/environment';

export namespace Strategy {
	export const Whiteboards = new Struct({
		name: 'whiteboards',
		structure: {
			name: 'string',
			strategyId: 'string'
		},
		socket: sse,
		browser
	});

	export type WhiteboardData = StructData<typeof Whiteboards.data.structure>;
	export type WhiteboardArr = DataArr<typeof Whiteboards.data.structure>;

	export const Strategy = new Struct({
		name: 'strategy',
		structure: {
			name: 'string',
			createdBy: 'string',
			matchId: 'string',
			customMatchId: 'string',
			comment: 'string'
		},
		socket: sse,
		browser
	});

	export type StrategyData = StructData<typeof Strategy.data.structure>;
	export type StrategyArr = DataArr<typeof Strategy.data.structure>;

	export const Alliances = new Struct({
		name: 'alliances',
		structure: {
			name: 'string',
			eventKey: 'string',
			team1: 'number',
			team2: 'number',
			team3: 'number',
			team4: 'number'
		},
		socket: sse,
		browser
	});

	export type AlliancesData = StructData<typeof Alliances.data.structure>;
	export type AlliancesArr = DataArr<typeof Alliances.data.structure>;
}

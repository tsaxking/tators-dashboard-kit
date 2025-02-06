import {
	EventSchema,
	MatchSchema,
	TeamSchema,
	type TBAEvent as E,
	type TBATeam as T,
	type TBAMatch as M,
	teamsFromMatch
} from 'tatorscout/tba';
import { attemptAsync, resolveAll } from 'ts-utils/check';
import { TBA } from '../structs/TBA';
import { StructData } from 'drizzle-struct/back-end';
import { string, z } from 'zod';

export class Event {
	public static getEvents(year: number) {
		return attemptAsync<Event[]>(async () => {
			const custom = (
				await TBA.Events.fromProperty('year', year, {
					type: 'stream'
				}).await()
			).unwrap();

			const tba = (
				await TBA.get<E[]>(`/team/frc2122/events/${year}`, {
					updateThreshold: 1000 * 60 * 60 * 24
				})
			).unwrap();

			return [
				...custom.map((e) => new Event(EventSchema.parse(JSON.parse(e.data.data)), true, e)),
				...tba.map((e) => new Event(e, false))
			].sort((a, b) => new Date(a.tba.start_date).getTime() - new Date(b.tba.start_date).getTime());
		});
	}

	public static getEvent(eventKey: string) {
		return attemptAsync(async () => {
			const custom = (
				await TBA.Events.fromProperty('eventKey', eventKey, {
					type: 'single'
				})
			).unwrap();
			if (custom) return new Event(EventSchema.parse(JSON.parse(custom.data.data)), true, custom);

			const fromtba = (
				await TBA.get<E>(`/event/${eventKey}`, {
					updateThreshold: 1000 * 60 * 60 * 24
				})
			).unwrap();
			return new Event(fromtba, false);
		});
	}

	public static createEvent(event: {
		key: string;
		name: string;
		startDate: Date;
		endDate: Date;
		year: number;
	}) {
		return attemptAsync(async () => {
			const tbaObj: E = {
				key: event.key,
				name: event.name,
				start_date: event.startDate.toISOString(),
				end_date: event.endDate.toISOString(),
				year: event.year,
				event_code: '???',
				event_type: 0,
				district: {
					abbreviation: '???',
					display_name: '???',
					key: '???',
					year: event.year
				},
				city: '???',
				state_prov: '???',
				country: '???'
			};

			return (
				await TBA.Events.new({
					year: event.year,
					eventKey: event.key,
					data: JSON.stringify(tbaObj)
				})
			).unwrap();
		});
	}

	constructor(
		public readonly tba: E,
		public readonly custom: boolean,
		public readonly data?: StructData<typeof TBA.Events.data.structure>
	) {}

	public getTeams() {
		return attemptAsync(async () => {
			if (this.custom) {
				return (
					await TBA.Teams.fromProperty('eventKey', this.tba.key, {
						type: 'stream'
					}).await()
				)
					.unwrap()
					.map((d) => new Team(TeamSchema.parse(JSON.parse(d.data.data)), this));
			} else {
				return (
					await TBA.get<T[]>(`/event/${this.tba.key}/teams`, {
						updateThreshold: 1000 * 60 * 60 * 24
					})
				)
					.unwrap()
					.map((t) => new Team(t, this));
			}
		});
	}

	public getMatches() {
		return attemptAsync(async () => {
			if (this.custom) {
				return (
					await TBA.Matches.fromProperty('eventKey', this.tba.key, {
						type: 'stream'
					}).await()
				)
					.unwrap()
					.map((m) => new Match(MatchSchema.parse(JSON.parse(m.data.data)), this));
			} else {
				return (
					await TBA.get<M[]>(`/event/${this.tba.key}/matches`, {
						updateThreshold: 1000 * 60 * 10
					})
				)
					.unwrap()
					.map((t) => new Match(t, this));
			}
		});
	}

	delete() {
		return attemptAsync(async () => {
			if (this.data) {
				// const [matches, teams] = await Promise.all([this.getMatches(), this.getTeams()]);
				// resolveAll(await Promise.all([
				//     ...matches.unwrap(),
				//     ...teams.unwrap(),
				// ].map(e => e.delete()))).unwrap();
				(await this.data.delete()).unwrap();
			} else throw new Error('Cannot delete a non-custom event');
		});
	}
}

export class Match {
	constructor(
		public readonly tba: M,
		public readonly event: Event,
		public readonly data?: StructData<typeof TBA.Matches.data.structure>
	) {}

	get custom() {
		return this.event.custom;
	}

	public getTeams() {
		return attemptAsync(async () => {
			const teams = teamsFromMatch(this.tba);
			return (await this.event.getTeams())
				.unwrap()
				.filter((t) => teams.includes(t.tba.team_number));
		});
	}

	// delete() {
	//     return attemptAsync(async () => {
	//         if (this.data) {
	//             (await this.data.delete()).unwrap();
	//         }
	//     });
	// }
}

export class Team {
	constructor(
		public readonly tba: T,
		public readonly event: Event,
		public readonly data?: StructData<typeof TBA.Teams.data.structure>
	) {}

	get custom() {
		return this.event.custom;
	}

	public getMatches() {
		return attemptAsync(async () => {
			return (await this.event.getMatches())
				.unwrap()
				.filter((m) => teamsFromMatch(m.tba).includes(this.tba.team_number));
		});
	}

	// delete() {
	//     return attemptAsync(async () => {
	//         if (this.data) {
	//             (await this.data.delete()).unwrap();
	//         }
	//     });
	// }
}

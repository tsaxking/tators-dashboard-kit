import { type TBAEvent as E, type TBATeam as T, type TBAMatch as M, teamsFromMatch } from 'tatorscout-utils/tba';
import { attemptAsync } from 'ts-utils/check';
import { TBA } from '../structs/TBA';

export class Event {
    public static getEvents(year: number) {
        return attemptAsync<Event[]>(async () => {
            const custom = (await TBA.Events.fromProperty('year', year, {
                type: 'array',
                limit: 100,
                offset: 0,
            })).unwrap();

            const tba = (await TBA.get<E[]>(`/team/frc2122/events/${year}`, {
                updateThreshold: 1000 * 60 * 60 * 24,
            })).unwrap();

            return [
                ...custom.map(e => new Event(JSON.parse(e.data.data), true)), 
                ...tba.map(e => new Event(e, false))
            ].sort((a, b) => new Date(a.tba.start_date).getTime() - new Date(b.tba.start_date).getTime());
        });
    }


    public static getEvent(eventKey: string) {
        return attemptAsync(async () => {
            const custom = (await TBA.Events.fromProperty('eventKey', eventKey, {
                type: 'single',
            })).unwrap();
            if (custom) return new Event(JSON.parse(custom.data.data), true);

            const fromtba = (await TBA.get<E>(`/event/${eventKey}`, {
                updateThreshold: 1000 * 60 * 60 * 24,
            })).unwrap();
            return new Event(fromtba, false);
        });
    }

    constructor(
        public readonly tba: E,
        public readonly custom: boolean,
    ) {}

    public getTeams() {
        return attemptAsync(async () => {
            if (this.custom) {
                return (await TBA.Teams.fromProperty('eventKey', this.tba.key, {
                    type: 'array',
                    limit: 1000,
                    offset: 0,
                }))
                .unwrap()
                .map(d => new Team(JSON.parse(d.data.data), this));
            } else {
                return (await TBA.get<T[]>(`/event/${this.tba.key}/teams`, {
                    updateThreshold: 1000 * 60 * 60 * 24,
                }))
                    .unwrap()
                    .map(t => new Team(t, this));
            }
        });
    }


    public getMatches() {
        return attemptAsync(async () => {
            if (this.custom) {
                return (await TBA.Matches.fromProperty('eventKey', this.tba.key, {
                    type: 'array',
                    limit: 1000,
                    offset: 0,
                })).unwrap().map(m => new Match(JSON.parse(m.data.data), this));
            } else {
                return (await TBA.get<M[]>(`/event/${this.tba.key}/matches`, {
                    updateThreshold: 1000 * 60 * 10,
                }))
                    .unwrap()
                    .map(t => new Match(t, this));
            }
        });
    }
}

export class Match {
    constructor(
        public readonly tba: M,
        public readonly event: Event
    ) {}

    get custom() {
        return this.event.custom;
    }

    public getTeams() {
        return attemptAsync(async () => {
            const teams = teamsFromMatch(this.tba);
            return (await this.event.getTeams())
                .unwrap()
                .filter(t => teams.includes(t.tba.team_number));
        });
    }
}

export class Team {
    constructor(
        public readonly tba: T,
        public readonly event: Event,
    ) {}

    get custom() {
        return this.event.custom;
    }

    public getMatches() {
        return attemptAsync(async () => {
            return (await this.event.getMatches())
                .unwrap()
                .filter(m => teamsFromMatch(m.tba).includes(this.tba.team_number));
        });
    }
}
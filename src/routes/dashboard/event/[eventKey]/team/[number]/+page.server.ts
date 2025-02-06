import { FIRST } from '$lib/server/structs/FIRST.js';
import { Scouting } from '$lib/server/structs/scouting.js';
import { and, eq } from 'drizzle-orm';

export const load = async (event) => {
    const eventKey = event.params.eventKey;
    const number = parseInt(event.params.number);

    const matchScouting = (await Scouting
        .MatchScouting
        .database
        .select()
        .from(Scouting.MatchScouting.table)
        .innerJoin(FIRST.Matches.table, eq(FIRST.Matches.table.id, Scouting.MatchScouting.table.matchId))
        .where(and(eq(FIRST.Matches.table.eventKey, eventKey), eq(Scouting.MatchScouting.table.team, number))))
        .map(r => ({
            matchScouting: Scouting.MatchScouting.Generator(r.match_scouting),
            match: FIRST.Matches.Generator(r.matches),
        }));
};
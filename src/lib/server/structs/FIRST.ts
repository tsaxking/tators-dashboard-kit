import { boolean } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';

export namespace FIRST {
	export const TeamPictures = new Struct({
		name: 'team_pictures',
		structure: {
			number: integer('number').notNull(),
			eventKey: text('event_key').notNull(),
			picture: text('picture').notNull(),
			accountId: text('account_id').notNull()
		},
		generators: {
			universe: () => '2122'
		}
	});

	// TeamPictures.on('delete', (pic) => {});

	export const Matches = new Struct({
		name: 'matches',
		structure: {
			eventKey: text('event_key').notNull(),
			number: integer('number').notNull(),
			compLevel: text('comp_level').notNull()
		},
		generators: {
			universe: () => '2122'
		}
	});

	export const CustomMatches = new Struct({
		name: 'custom_matches',
		structure: {
			name: text('name').notNull(),
			eventKey: text('event_key').notNull(),
			number: integer('number').notNull(),
			compLevel: text('comp_level').notNull(),
			red1: integer('red1').notNull(),
			red2: integer('red2').notNull(),
			red3: integer('red3').notNull(),
			red4: integer('red4').notNull(),
			blue1: integer('blue1').notNull(),
			blue2: integer('blue2').notNull(),
			blue3: integer('blue3').notNull(),
			blue4: integer('blue4').notNull()
		},
		generators: {
			universe: () => '2122'
		}
	});
}

export const _firstTeamPicturesTable = FIRST.TeamPictures.table;
export const _firstMatchesTable = FIRST.Matches.table;
export const _firstCustomMatchesTable = FIRST.CustomMatches.table;

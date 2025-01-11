import { boolean, text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';
import { uuid } from '../utils/uuid';
import { attempt, attemptAsync } from 'ts-utils/check';
import crypto from 'crypto';

export namespace Account {
	export const Account = new Struct({
		name: 'account',
		structure: {
			username: text('username').notNull().unique(),
			key: text('key').notNull().unique(),
			salt: text('salt').notNull(),
			firstName: text('first_name').notNull(),
			lastName: text('last_name').notNull(),
			email: text('email').notNull().unique(),
			picture: text('picture').notNull(),
			verified: boolean('verified').notNull(),
			verification: text('verification').notNull()
		},
		generators: {
			id: () => (uuid() + uuid() + uuid() + uuid()).replace(/-/g, '')
		}
	});

	// Account.bypass('*', (a, b) => a.id === b?.id);

	Account.on('delete', async (a) => {
		Admins.fromProperty('accountId', a.id, {
			type: 'stream',
		}).pipe((a) => a.delete());
	});

	export const Admins = new Struct({
		name: 'admins',
		structure: {
			accountId: text('account_id').notNull().unique()
		}
	});

	export type AccountData = typeof Account.sample;

	export const newHash = (password: string) => {
		return attempt(() => {
			const salt = crypto.randomBytes(16).toString('hex');
			const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
			return { hash, salt };
		});
	};

	export const hash = (password: string, salt: string) => {
		return attempt(() => {
			return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
		});
	};

	export const createAccount = async (data:  {
		username: string;
		email: string;
		firstName: string;
		lastName: string;
		password: string;
	}) => {
		return attemptAsync(async () => {
			const hash = newHash(data.password).unwrap();
			const verificationId = uuid();
			const account = (await Account.new({
				username: data.username,
				email: data.email,
				firstName: data.firstName,
				lastName: data.lastName,
				key: hash.hash,
				salt: hash.salt,
				verified: false,
				verification: verificationId,
				picture: '/'
			})).unwrap();

			// send verification email

			return account;
		});
	}
}

// for drizzle
export const _accountTable = Account.Account.table;
export const _adminsTable = Account.Admins.table;

import { boolean, text, timestamp } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';
import { uuid } from '../utils/uuid';
import { attempt, attemptAsync } from 'ts-utils/check';
import crypto from 'crypto';
import { DB } from '../db';
import { sql } from 'drizzle-orm';
import type { Notification } from '$lib/types/notification';
import { Session } from './session';
import { sse } from '../utils/sse';
import { DataAction, PropertyAction } from 'drizzle-struct/types';

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

	// export const OAuth2Tokens = new Struct({
	// 	name: 'oauth2_tokens',
	// 	structure: {
	// 		accountId: text('account_id').notNull(),
	// 		accessToken: text('access_token').notNull(),
	// 		refreshToken: text('refresh_token').notNull(),
	// 		scope: text('scope').notNull(),
	// 		tokenType: text('token_type').notNull(),
	// 		idToken: text('id_token').notNull(),
	// 		expiryDate: text('expiry_date').notNull()
	// 	},
	// });

	// export type OAuth2TokensData = typeof OAuth2Tokens.sample;

	// Account.bypass('*', (a, b) => a.id === b?.id);

	Account.on('delete', async (a) => {
		Admins.fromProperty('accountId', a.id, {
			type: 'stream'
		}).pipe((a) => a.delete());
	});

	export const Admins = new Struct({
		name: 'admins',
		structure: {
			accountId: text('account_id').notNull().unique()
		}
	});

	export type AccountData = typeof Account.sample;

	export const AccountNotification = new Struct({
		name: 'account_notification',
		structure: {
			accountId: text('account_id').notNull(),
			title: text('title').notNull(),
			severity: text('severity').notNull(),
			message: text('message').notNull(),
			icon: text('icon').notNull(),
			link: text('link').notNull(),
			read: boolean('read').notNull(),
		}
	});

	AccountNotification.bypass(DataAction.Delete, (a, b) => a.id === b?.accountId);
	AccountNotification.bypass(PropertyAction.Update, (a, b) => a.id === b?.accountId);

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

	export const createAccount = async (data: {
		username: string;
		email: string;
		firstName: string;
		lastName: string;
		password: string;
	}) => {
		return attemptAsync(async () => {
			const hash = newHash(data.password).unwrap();
			const verificationId = uuid();
			const account = (
				await Account.new({
					username: data.username,
					email: data.email,
					firstName: data.firstName,
					lastName: data.lastName,
					key: hash.hash,
					salt: hash.salt,
					verified: false,
					verification: verificationId,
					picture: '/'
				})
			).unwrap();

			// send verification email

			return account;
		});
	};

	export const searchAccounts = async (
		query: string,
		config: {
			type: 'array';
			limit: number;
			offset: number;
		}
	) => {
		return attemptAsync(async () => {
			const res = await DB.select()
				.from(Account.table)
				.where(sql`${Account.table.username} LIKE ${query} OR ${Account.table.email} LIKE ${query}`)
				.limit(config.limit)
				.offset(config.offset);

			return res.map((a) => Account.Generator(a));
		});
	};

	export const notifyPopup = async (accountId: string, notification: Notification) => {
		return attemptAsync(async () => {
			Session.Session.fromProperty('accountId', accountId, {
				type: 'stream'
			}).pipe((s) => sse.fromSession(s.id)?.notify(notification));
		});
	};

	export const sendEmail = () => {
		return attemptAsync(async () => {});
	};

	export const sendAccountNotif = (
		accountId: string,
		notif: Notification & {
			icon: string;
			link: string;
		}
	) => {
		notifyPopup(accountId, notif);
		return AccountNotification.new({
			title: notif.title,
			severity: notif.severity,
			message: notif.message,
			accountId: accountId,
			icon: notif.icon,
			link: notif.link,
			read: false,
		});
	};

	export const createAccountFromOauth = (data: {
		email?: string | null;
		given_name?: string | null;
		family_name?: string | null;
		picture?: string | null;
	}) => {
		return attemptAsync(async () => {
			// const oauth2 = google.oauth2({
			// 	auth: client,
			// 	version: 'v2',
			// });
			// const userInfo = await oauth2.userinfo.get();
			const email = data.email;
			const firstName = data.given_name;
			const lastName = data.family_name;
			const picture = data.picture ?? '/';

			if (!email) throw new Error('No email provided');
			if (!firstName) throw new Error('No first name provided');
			if (!lastName) throw new Error('No last name provided');

			const username = email.split('@')[0];
			const verificationId = uuid();

			// send verification email

			// hash and salt are not needed as the authentication is handled by google in this case
			return (await Account.new({
				username,
				email,
				firstName,
				lastName,
				key: '',
				salt: '',
				verified: false,
				verification: verificationId,
				picture
			})).unwrap();
		});
	}
}

// for drizzle
export const _accountTable = Account.Account.table;
// export const _oauth2TokensTable = Account.OAuth2Tokens.table;
export const _adminsTable = Account.Admins.table;

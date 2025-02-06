/* eslint-disable @typescript-eslint/no-explicit-any */
import { Account } from '../structs/account';
import { selectData, structActions } from './struct';
import { Action, confirm, Folder, password, prompt } from './utils';
import terminal from '../utils/terminal';

export default new Folder('Accounts', 'Edit accounts', '👤', [
	new Action('List', 'List all accounts', '📋', async () => {
		return (await structActions.all(Account.Account as any)).unwrap();
	}),
	new Action('Create', 'Create a new account', '➕', async () => {
		const username = (
			await prompt({
				message: 'Enter a username'
			})
		).unwrap();
		if (!username) return;
		const p = (
			await password({
				message: 'Enter a password'
			})
		).unwrap();
		if (!p) return;

		const { hash, salt } = Account.newHash(p).unwrap();

		return (
			await structActions.new(Account.Account as any, undefined, {
				username,
				key: hash,
				salt
			})
		).unwrap();
	}),
	new Action('Verify', 'Verify an account', '🔐', async () => {
		const accounts = (
			await Account.Account.fromProperty('verified', false, {
				type: 'stream'
			}).await()
		).unwrap();
		const a = (await selectData(accounts as any)).unwrap();
		if (typeof a === 'undefined') return terminal.log('Cancelled');
		const account = accounts[a];
		if (!account) return terminal.log('Invalid account');
		const confirmed = await confirm({
			message: `Verify ${account.data.username}?`
		});

		if (!confirmed) return terminal.log('Cancelled');

		await account.update({
			verification: '',
			verified: true
		});

		return terminal.log(`Account ${account.data.username} is now verified`);
	}),
	new Action('Unverify', 'Unverify an account', '🔓', async () => {
		const accounts = (
			await Account.Account.fromProperty('verified', true, {
				type: 'stream'
			}).await()
		).unwrap();
		const a = (await selectData(accounts as any)).unwrap();
		if (typeof a === 'undefined') return terminal.log('Cancelled');
		const account = accounts[a];
		if (!account) return terminal.log('Invalid account');
		const confirmed = await confirm({
			message: `Unverify ${account.data.username}?`
		});

		if (!confirmed) return terminal.log('Cancelled');

		await account.update({
			verified: false
		});

		return terminal.log(`Account ${account.data.username} is now unverified`);
	}),
	new Action('Make Admin', 'Make an account an admin', '👑', async () => {
		const accounts = (
			await Account.Account.all({
				type: 'stream'
			}).await()
		).unwrap();
		const a = (await selectData(accounts as any)).unwrap();
		if (typeof a === 'undefined') return terminal.log('Cancelled');
		const account = accounts[a];
		if (!account) return terminal.log('Invalid account');
		const confirmed = await confirm({
			message: `Make ${account.data.username} an admin?`
		});

		if (!confirmed) return terminal.log('Cancelled');

		const isAdmin = (
			await Account.Admins.fromProperty('accountId', account.id, {
				type: 'stream'
			}).await()
		).unwrap().length;
		if (isAdmin) return terminal.log('Account is already an admin');

		(
			await Account.Admins.new({
				accountId: account.id
			})
		).unwrap();

		return terminal.log(`Account ${account.data.username} is now an admin`);
	}),
	new Action('Remove Admin', 'Remove an account as an admin', '🚫', async () => {
		const admins = (
			await Account.Admins.all({
				type: 'stream'
			}).await()
		).unwrap();
		const a = (await selectData(admins as any)).unwrap();
		if (typeof a === 'undefined') return terminal.log('Cancelled');
		const admin = admins[a];
		if (!admin) return terminal.log('Invalid admin');
		const account = (await Account.Account.fromId(admin.data.accountId)).unwrap();
		if (!account) return terminal.log('Invalid account');
		const confirmed = await confirm({
			message: `Remove ${account.data.username} as an admin?`
		});

		if (!confirmed) return terminal.log('Cancelled');

		(await admin.delete()).unwrap();

		return terminal.log(`Account ${account.data.username} is no longer an admin`);
	})
]);

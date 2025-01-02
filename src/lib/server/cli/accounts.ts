import type { Struct } from "drizzle-struct/src/back-end";
import { Account } from "../structs/account";
import { selectData, structActions } from "./struct";
import { Action, confirm, Folder, password, prompt } from "./utils";

export default new Folder(
    'Accounts',
    'Edit accounts',
    '👤',
    [
        new Action(
            'List',
            'List all accounts',
            '📋',
            async () => {
                return (await structActions.all(Account.Account as Struct)).unwrap();
            },
        ),
        new Action(
            'Create',
            'Create a new account',
            '➕',
            async () => {
                const username = (await prompt({
                    message: 'Enter a username',
                })).unwrap();
                if (!username) return;
                const p = (await password({
                    message: 'Enter a password',
                })).unwrap();
                if (!p) return;

                const { hash, salt } = Account.newHash(p).unwrap();

                return (await structActions.new(Account.Account, undefined, {
                    username,
                    key: hash,
                    salt,
                })).unwrap();
            },
        ),
        new Action(
            'Verify',
            'Verify an account',
            '🔐',
            async () => {
                const accounts = (await Account.Account.fromProperty('verified', false, false)).unwrap();
                const a = (await selectData(accounts)).unwrap();
                if (typeof a === 'undefined') return console.log('Cancelled');
                const account = accounts[a];
                if (!account) return console.log('Invalid account');
                const confirmed = await confirm({
                    message: `Verify ${account.data.username}?`,
                });

                if (!confirmed) return console.log('Cancelled');

                (await account.update({
                    verification: '',
                    verified: true,
                }));

                return console.log(`Account ${account.data.username} is now verified`);
            },
        ),
        new Action(
            'Unverify',
            'Unverify an account',
            '🔓',
            async () => {
                const accounts = (await Account.Account.fromProperty('verified', true, false)).unwrap();
                const a = (await selectData(accounts)).unwrap();
                if (typeof a === 'undefined') return console.log('Cancelled');
                const account = accounts[a];
                if (!account) return console.log('Invalid account');
                const confirmed = await confirm({
                    message: `Unverify ${account.data.username}?`,
                });

                if (!confirmed) return console.log('Cancelled');

                (await account.update({
                    verified: false,
                }));

                return console.log(`Account ${account.data.username} is now unverified`);
            }
        ),
        new Action(
            'Make Admin',
            'Make an account an admin',
            '👑',
            async () => {
                const accounts = (await Account.Account.all(false)).unwrap();
                const a = (await selectData(accounts)).unwrap();
                if (typeof a === 'undefined') return console.log('Cancelled');
                const account = accounts[a];
                if (!account) return console.log('Invalid account');
                const confirmed = await confirm({
                    message: `Make ${account.data.username} an admin?`,
                });

                if (!confirmed) return console.log('Cancelled');

                const isAdmin = (await Account.Admins.fromProperty('accountId', account.id, false)).unwrap().length;
                if (isAdmin) return console.log('Account is already an admin');

                (await Account.Admins.new({
                    accountId: account.id,
                })).unwrap();

                return console.log(`Account ${account.data.username} is now an admin`);
            },
        ),
        new Action(
            'Remove Admin',
            'Remove an account as an admin',
            '🚫',
            async () => {
                const admins = (await Account.Admins.all(false)).unwrap();
                const a = (await selectData(admins)).unwrap();
                if (typeof a === 'undefined') return console.log('Cancelled');
                const admin = admins[a];
                if (!admin) return console.log('Invalid admin');
                const account = (await Account.Account.fromId(admin.data.accountId)).unwrap();
                if (!account) return console.log('Invalid account');
                const confirmed = await confirm({
                    message: `Remove ${account.data.username} as an admin?`,
                });

                if (!confirmed) return console.log('Cancelled');

                (await admin.delete()).unwrap();

                return console.log(`Account ${account.data.username} is no longer an admin`);
            },
        )
    ]
);
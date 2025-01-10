import { attemptAsync } from 'ts-utils/check';
import { sse } from '$lib/utils/sse';
import { Struct, type PartialStructable, type Structable, type GlobalCols, StructData } from 'drizzle-struct/front-end';
import { Requests } from '$lib/utils/requests';

export namespace Account {
	export const Account = new Struct({
		name: 'account',
		structure: {
			username: 'string',
			key: 'string',
			salt: 'string',
			firstName: 'string',
			lastName: 'string',
			email: 'string',
			picture: 'string',
			verified: 'boolean',
			verification: 'string',
		},
		socket: sse
	});

	export type AccountData = StructData<typeof Account.data.structure>;

	let self: AccountData | null = null;

	export const getSelf = async () => {
		return attemptAsync<AccountData>(async () => {
			if (self) return self;

			const data = (await Requests.get<PartialStructable<typeof Account.data.structure> & Structable<GlobalCols>>('/account/self',
				{
					expectStream: false,
				}
			)).unwrap();

			self = Account.Generator(data);

			return self;
		});
	};
}

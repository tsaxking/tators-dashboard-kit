import { DB } from '$lib/server/db';
import { connectionEmitter, handleEvent } from '$lib/server/event-handler';
import { Test } from '$lib/server/structs/testing';
import terminal from '$lib/server/utils/terminal';

if (!Test.Test.built) {
	Test.Test.build(DB).then((res) => {
		if (res.isErr()) {
			terminal.error(res.error);
		}
	});
	Test.Test.eventHandler(handleEvent(Test.Test));
	// TODO: make this base on .env?
	Test.Test.bypass('*', () => true);
	connectionEmitter(Test.Test);
}

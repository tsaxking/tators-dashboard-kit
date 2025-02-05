import { Email } from '../src/lib/server/structs/email';
import terminal from '../src/lib/server/utils/terminal';

export default async () => {
    terminal.log('Sending test email');
    return (await Email.send({
        type: 'test',
        data: {
            something: 'Hello world!',
        },
        to: 'taylor.reese.king@gmail.com',
        subject: 'Test email',
    })).unwrap();
};
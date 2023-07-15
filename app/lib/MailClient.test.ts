// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { setImmediate } from 'timers';

import { MailClientMock } from './MailClientMock';
import { MailMessage } from './MailMessage';

global.setImmediate = setImmediate;

describe('MailClient', () => {
    it('it is able to verify connections while using the mock', async () => {
        const client = new MailClientMock();
        client.mock.setMockedVerify(true);

        expect(client.sender).toEqual('AnimeCon <user@example.com>');

        const result = await client.verifyConfiguration();
        expect(result).toBeTruthy();
    });

    it('is able to build messages using a builder pattern', async () => {
        const message = new MailMessage()
            .setTo('user@example.com')
            .setCc('another@example.com')
            .setBcc([ 'foo@bar.com', 'baz@qux.com' ])
            .addHeader('X-Foo', 'Bar')
            .addHeader('X-Baz', 'Qux')
            .setSubject('This is a test')
            .setHtml('<b>Hello, world!</b>')
            .setText('Hello, world!');

        expect(message.options).toEqual({
            // Defaults:
            disableFileAccess: true,
            disableUrlAccess: true,

            // Configuration:
            to: 'user@example.com',
            cc: 'another@example.com',
            bcc: [ 'foo@bar.com', 'baz@qux.com' ],
            headers: [
                { key: 'X-Foo', value: 'Bar' },
                { key: 'X-Baz', value: 'Qux' },
            ],
            subject: 'This is a test',
            html: '<b>Hello, world!</b>',
            text: 'Hello, world!',
        });

        const client = new MailClientMock('My Name');
        const info = await client.sendMessage(message);
        expect(info.messageId.length).toBeGreaterThan(16);

        const [ sentMessage ] = client.mock.getSentMail();
        expect(sentMessage).toEqual({
            from: 'My Name <user@example.com>',
            ...message.options,
        });
    });

    it('is able to build messages using markdown', () => {
        const message = new MailMessage().setMarkdown('**Hello** {who}!', { who: 'world' });
        expect(message.options).toEqual({
            // Defaults:
            disableFileAccess: true,
            disableUrlAccess: true,
            headers: [],

            // Configuration:
            html: '<p><strong>Hello</strong> world!</p>\n',
            text: '**Hello** world!',
        });
    });
});

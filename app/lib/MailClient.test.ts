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
});

// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Publish } from './Publish';
import { SubscriptionType } from '@lib/database/Types';
import { useMockConnection } from '@lib/database/Connection';

describe('Publish', () => {
    const mockConnection = useMockConnection();

    it('is able to request fanout of messages to e-mail', async () => {
        // TODO
    });

    it('is able to request fanout of messages to Web Push Notifications', async () => {
        // TODO
    });

    it('is able to request fanout of messages to SMS', async () => {
        // TODO
    });

    it('is able to request fanout of messages to WhatsApp', async () => {
        // TODO
    });
});

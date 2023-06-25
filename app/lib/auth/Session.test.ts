// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type SessionData, sealSession, unsealSession } from './Session';

import { TextDecoder, TextEncoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

describe('Session', () => {
    it('should be able to seal and unseal sessions', async () => {
        const plaintextSession: SessionData = {
            id: 9001,
            token: 1234,
        };

        const sealedSession = await sealSession(plaintextSession);
        const unsealedSession = await unsealSession(sealedSession);

        expect(unsealedSession).toEqual(plaintextSession);
    });
});

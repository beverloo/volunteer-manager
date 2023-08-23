// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { PasswordResetRequest } from './PasswordReset';
import { sealPasswordResetRequest, unsealPasswordResetRequest } from './PasswordReset';

import { TextDecoder, TextEncoder } from 'util';

global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

describe('PasswordReset', () => {
    it('should be able to seal and unseal password requests', async () => {
        const plaintextRequest: PasswordResetRequest = {
            id: 9001,
            token: 1234,
        };

        const sealedRequest = await sealPasswordResetRequest(plaintextRequest);
        const unsealedRequest = await unsealPasswordResetRequest(sealedRequest);

        expect(unsealedRequest).toEqual(plaintextRequest);
    });
});

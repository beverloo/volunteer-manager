// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { seal, unseal } from './Iron';

import { TextDecoder, TextEncoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

describe('Iron', () => {
    it('verifies that a sufficiently long password is used', async () => {
        const invalidPassword = 'too-short';
        const validPassword = 'this-password-definitely-is-long-enough';

        expect(seal(null, invalidPassword, 0)).rejects.toThrowError();
        expect(unseal('', invalidPassword, 0)).rejects.toThrowError();

        expect(seal(null, validPassword, 0)).resolves.toMatch(/^Fe/);
    });

    it('can roundtrip data of various types', async () => {
        const password = 'F4y%8wsHR(,fRML4Dg;ilT4{H2J5sSf<';

        async function roundtrip(data: unknown) {
            const sealedData = await seal(data, password, 32);
            return await unseal(sealedData, password, 32);
        }

        expect(roundtrip(null)).resolves.toEqual(null);
        expect(roundtrip(true)).resolves.toEqual(true);
        expect(roundtrip(false)).resolves.toEqual(false);

        expect(roundtrip(3.1415)).resolves.toEqual(3.1415);
        expect(roundtrip('hello, world')).resolves.toEqual('hello, world');
        expect(roundtrip({ value: 42 })).resolves.toEqual({ value: 42 });
    });

    it('can roundtrip data with various passwords', async () => {
        const plaintext = { fruit: 'banana' };

        const firstPassword = '0ySycf@=slZNkn.R9zX.n+OL2+H<=YQW';
        const firstSealedData = await seal(plaintext, firstPassword, 32);

        const secondPassword = '{?cDE+yN=MupSGXpel0GAR0#*%jaLanj';
        const secondSealedData = await seal(plaintext, secondPassword, 32);

        expect(firstSealedData).not.toEqual(secondSealedData);
        expect(unseal(firstSealedData, firstPassword, 32)).resolves.toEqual(plaintext);
        expect(unseal(firstSealedData, secondPassword, 32)).rejects.toThrowError();

        expect(unseal(secondSealedData, firstPassword, 32)).rejects.toThrowError();
        expect(unseal(secondSealedData, secondPassword, 32)).resolves.toEqual(plaintext);
    });
});

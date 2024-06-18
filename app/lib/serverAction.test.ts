// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { serverAction } from './serverAction';

describe('serverAction', () => {
    function toFormData(data: Record<string, any>) {
        const formData = new FormData;
        for (const [ key, value ] of Object.entries(data))
            formData.set(key, value);

        return formData;
    }

    it('should reject invalid form data types', async () => {
        // TODO: Implement this test
    });

    it('should reject form data with missing fields', async () => {
        // TODO: Implement this test
    });

    it('should reject form data with fields having invalid types', async () => {
        const scheme = z.object({
            foo: z.number(),
        });

        const action = serverAction(scheme, async (data, props) => { /* void */ });
        const result = await action(toFormData({
            foo: 'bar',
        }));

        expect(result).toBeObject();
        expect(result.success).toBeFalse();
    });

    it('should be able to transform the input/output using Zod', async () => {
        // TODO: Implement this test
    });

    it('should fail invocations where an exception is thrown', async () => {
        // TODO: Implement this test
    });

    it('should represent uploaded files as Uint8Array values', async () => {
        // TODO: Implement this test
    });
});

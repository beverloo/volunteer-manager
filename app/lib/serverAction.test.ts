// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { serverAction } from './serverAction';

describe('serverAction', () => {
    function toFormData(data: Record<string, any>) {
        const formData = new FormData;
        for (const [ key, value ] of Object.entries(data)) {
            if (Array.isArray(value)) {
                for (const v of value)
                    formData.append(key, v);
            } else {
                formData.set(key, value);
            }
        }

        return formData;
    }

    it('should reject invalid form data types', async () => {
        let invocations = 0;

        const scheme = z.object({ /* empty */ });
        const action = serverAction(scheme, async () => { ++invocations; });

        {
            const result = await action(/* formData= */ undefined as any);
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);

            !result.success && expect(result.error).toBe('Invalid form data received from Next.js');
        }
        {
            const result = await action(/* formData= */ null as any);
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);

            !result.success && expect(result.error).toBe('Invalid form data received from Next.js');
        }
        {
            const result = await action(/* formData= */ {} as any);
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);

            !result.success && expect(result.error).toBe('Invalid form data received from Next.js');
        }
        {
            const result = await action(/* formData= */ new FormData);
            expect(result.success).toBeTrue();
            expect(invocations).toBe(1);
        }
    });

    it('should reject form data with missing fields', async () => {
        let invocations = 0;

        const scheme = z.object({
            a: z.coerce.number(),
            b: z.coerce.number(),
        });

        const action = serverAction(scheme, async () => { ++invocations; });

        {
            const result = await action(toFormData({ a: 42 }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);

            !result.success && expect(result.error).toBe('Field b: Expected number, received nan');
        }
        {
            const result = await action(toFormData({ b: 101 }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);

            !result.success && expect(result.error).toBe('Field a: Expected number, received nan');
        }
        {
            const result = await action(toFormData({ a: 42, b: 101 }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(1);
        }
    });

    it('should reject form data with fields having invalid types', async () => {
        let invocations = 0;

        const scheme = z.object({
            a: z.coerce.number(),
            b: z.boolean(),
        });

        const action = serverAction(scheme, async () => { ++invocations; });

        {
            const result = await action(toFormData({ a: 42, b: 121 }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);

            !result.success &&
                expect(result.error).toBe('Field b: Expected boolean, received string');
        }
        {
            const result = await action(toFormData({ a: '42', b: 121 }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);

            !result.success &&
                expect(result.error).toBe('Field b: Expected boolean, received string');
        }
        {
            const result = await action(toFormData({ a: 42, b: true }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(1);
        }
    });

    it('should be able to coerce arrays from FormData input', async () => {
        let a: number[] | undefined;
        let invocations = 0;

        const scheme = z.object({
            a: z.array(z.coerce.number()),
        });

        const action = serverAction(scheme, async (data) => { a = data.a; ++invocations; });

        {
            const result = await action(toFormData({ a: 'banana' }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);

            !result.success &&
                expect(result.error).toBe('Field a.0: Expected number, received nan');
        }
        {
            const result = await action(toFormData({ a: false }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);

            !result.success &&
                expect(result.error).toBe('Field a.0: Expected number, received nan');
        }
        {
            const result = await action(toFormData({ a: [ 'banana' ] }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);

            !result.success &&
                expect(result.error).toBe('Field a.0: Expected number, received nan');
        }
        {
            const result = await action(toFormData({ a: [ 42, 'banana' ] }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);

            !result.success &&
                expect(result.error).toBe('Field a.1: Expected number, received nan');
        }
        {
            const result = await action(toFormData({ a: 42 }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(1);
            expect(a).toEqual([ 42 ]);
        }
        {
            const result = await action(toFormData({ a: [ 42 ] }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(2);
            expect(a).toEqual([ 42 ]);
        }
        {
            const result = await action(toFormData({ a: [ 42, 101 ] }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(3);
            expect(a).toEqual([ 42, 101 ]);
        }
    });

    it('should be able to coerce booleans from FormData input', async () => {
        let a: boolean | undefined;
        let invocations = 0;

        const scheme = z.object({
            a: z.boolean(),
        });

        const action = serverAction(scheme, async (data) => { a = data.a; ++invocations; });

        {
            const result = await action(toFormData({ a: 42 }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);

            !result.success &&
                expect(result.error).toBe('Field a: Expected boolean, received string');
        }
        {
            const result = await action(toFormData({ /* missing property */ }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);

            !result.success && expect(result.error).toBe('Field a: Required');
        }
        {
            const result = await action(toFormData({ a: { /* object */ } }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);

            !result.success &&
                expect(result.error).toBe('Field a: Expected boolean, received string');
        }
        {
            const result = await action(toFormData({ a: undefined }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);

            !result.success &&
                expect(result.error).toBe('Field a: Expected boolean, received string');
        }
        {
            const result = await action(toFormData({ a: null }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);

            !result.success &&
                expect(result.error).toBe('Field a: Expected boolean, received string');
        }
        {
            const result = await action(toFormData({ a: 'on' }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(1);
            expect(a).toBeTrue();
        }
        {
            const result = await action(toFormData({ a: 'true' }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(2);
            expect(a).toBeTrue();
        }
        {
            const result = await action(toFormData({ a: /* "true"= */ true }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(3);
            expect(a).toBeTrue();
        }
        {
            const result = await action(toFormData({ a: 'off' }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(4);
            expect(a).toBeFalse();
        }
        {
            const result = await action(toFormData({ a: 'false' }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(5);
            expect(a).toBeFalse();
        }
        {
            const result = await action(toFormData({ a: false }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(6);
            expect(a).toBeFalse();
        }
    });

    it('should be able to use Zod custom error messages', async () => {
        let invocations = 0;

        const scheme = z.object({
            a: z.coerce.number({
                required_error: 'Value must be provided',
                invalid_type_error: 'Value must be a number',
            })
            .min(10, { message: 'Value must be ten or more' })
            .max(20, { message: 'Value must be twenty or less' })
        });

        const action = serverAction(scheme, async (data) => { ++invocations; });

        {
            const result = await action(toFormData({ /* missing property */ }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);

            !result.success &&
                expect(result.error).toBe('Field a: Value must be a number');
        }
        {
            const result = await action(toFormData({ a: 'bananas' }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);

            !result.success &&
                expect(result.error).toBe('Field a: Value must be a number');
        }
        {
            const result = await action(toFormData({ a: '5' }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);

            !result.success &&
                expect(result.error).toBe('Field a: Value must be ten or more');
        }
        {
            const result = await action(toFormData({ a: '25' }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);

            !result.success &&
                expect(result.error).toBe('Field a: Value must be twenty or less');
        }
        {
            const result = await action(toFormData({ a: '15' }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(1);
        }
    });

    it('should be able to transform the input/output using Zod', async () => {
        let a: number | undefined;
        let invocations = 0;

        const scheme = z.object({
            a: z.coerce.number().transform(v => v * 2),
        });

        const action = serverAction(scheme, async (data) => { a = data.a; ++invocations; });

        const result = await action(toFormData({ a: '15' }));
        expect(result.success).toBeTrue();
        expect(invocations).toBe(1);
        expect(a).toBe(30);
    });

    it('should fail invocations where an exception is thrown', async () => {
        // TODO: Implement this test
    });

    it('should represent uploaded files as Uint8Array values', async () => {
        // TODO: Implement this test
    });
});

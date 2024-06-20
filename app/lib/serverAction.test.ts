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

    it('should be able to deal with nullable and optional values', async () => {
        let invocations = 0;
        let value: any = undefined;

        const nullableScheme = z.object({ a: z.boolean().nullable() });
        const nullableAction = serverAction(nullableScheme, async (data) => {
            value = data.a;
            ++invocations;
        });

        {
            const result = await nullableAction(toFormData({ /* missing property */ }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);
            expect(value).toBeUndefined();
        }
        {
            const result = await nullableAction(toFormData({ a: undefined }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);
            expect(value).toBeUndefined();
        }
        {
            const result = await nullableAction(toFormData({ a: 'bananas' }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);
            expect(value).toBeUndefined();
        }
        {
            const result = await nullableAction(toFormData({ a: null }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(1);
            expect(value).toBeNull();
        }
        {
            const result = await nullableAction(toFormData({ a: false }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(2);
            expect(value).toBeFalse();
        }

        const nullishScheme = z.object({ a: z.boolean().nullish() });
        const nullishAction = serverAction(nullishScheme, async (data) => {
            value = data.a;
            ++invocations;
        });

        value = undefined;

        {
            const result = await nullishAction(toFormData({ /* missing property */ }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(3);
            expect(value).toBeUndefined();
        }
        {
            const result = await nullishAction(toFormData({ a: undefined }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(4);
            expect(value).toBeUndefined();
        }
        {
            const result = await nullishAction(toFormData({ a: 'bananas' }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(4);
            expect(value).toBeUndefined();
        }
        {
            const result = await nullishAction(toFormData({ a: null }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(5);
            expect(value).toBeNull();
        }
        {
            const result = await nullishAction(toFormData({ a: false }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(6);
            expect(value).toBeFalse();
        }

        const optionalScheme = z.object({ a: z.boolean().optional() });
        const optionalAction = serverAction(optionalScheme, async (data) => {
            value = data.a;
            ++invocations;
        });

        value = undefined;

        {
            const result = await optionalAction(toFormData({ /* missing property */ }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(7);
            expect(value).toBeUndefined();
        }
        {
            const result = await optionalAction(toFormData({ a: undefined }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(8);
            expect(value).toBeUndefined();
        }
        {
            const result = await optionalAction(toFormData({ a: 'bananas' }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(8);
            expect(value).toBeUndefined();
        }
        {
            const result = await optionalAction(toFormData({ a: null }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(8);
            expect(value).toBeUndefined();
        }
        {
            const result = await optionalAction(toFormData({ a: false }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(9);
            expect(value).toBeFalse();
        }

        const arrayScheme = z.object({ a: z.array(z.coerce.number()).nullish() });
        const arrayAction = serverAction(arrayScheme, async (data) => {
            value = data.a;
            ++invocations;
        });

        value = undefined;

        {
            const result = await arrayAction(toFormData({ /* missing property */ }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(10);
            expect(value).toBeUndefined();
        }
        {
            const result = await arrayAction(toFormData({ a: undefined }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(11);
            expect(value).toBeUndefined();
        }
        {
            const result = await arrayAction(toFormData({ a: '15' }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(12);
            expect(value).toEqual([ 15 ]);
        }
        {
            const result = await arrayAction(toFormData({ a: null }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(13);
            expect(value).toBeNull();
        }
        {
            const result = await arrayAction(toFormData({ a: [ '15', '42' ] }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(14);
            expect(value).toEqual([ 15, 42 ]);
        }
        {
            const result = await arrayAction(toFormData({ a: [ '15', null, '42' ] }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(14);
        }

        const nullArrayScheme = z.object({ a: z.array(z.coerce.number().nullish()) });
        const nullArrayAction = serverAction(nullArrayScheme, async (data) => {
            value = data.a;
            ++invocations;
        });

        value = undefined;

        {
            const result = await nullArrayAction(toFormData({ /* missing property */ }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(14);
            expect(value).toBeUndefined();
        }
        {
            const result = await nullArrayAction(toFormData({ a: undefined }));
            expect(result.success).toBeTrue();  // single values are automatically array-ified
            expect(invocations).toBe(15);
            expect(value).toEqual([ undefined ]);
        }
        {
            const result = await nullArrayAction(toFormData({ a: '15' }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(16);
            expect(value).toEqual([ 15 ]);
        }
        {
            const result = await nullArrayAction(toFormData({ a: 'banana' }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(16);
        }
        {
            const result = await nullArrayAction(toFormData({ a: null }));
            expect(result.success).toBeTrue();  // single values are automatically array-ified
            expect(invocations).toBe(17);
            expect(value).toEqual([ null ]);
        }
        {
            const result = await nullArrayAction(toFormData({ a: [ '15', '42' ] }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(18);
            expect(value).toEqual([ 15, 42 ]);
        }
        {
            const result = await nullArrayAction(toFormData({ a: [ '15', null, '42' ] }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(19);
            expect(value).toEqual([ 15, null, 42 ]);
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
        let value: any;
        let invocations = 0;

        const sameTypeScheme = z.object({
            a: z.coerce.number().transform(v => v * 2),
        });

        const sameTypeAction =
            serverAction(sameTypeScheme, async (data) => { value = data.a; ++invocations; });

        {
            const result = await sameTypeAction(toFormData({ a: '15' }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(1);
            expect(value).toBe(30);
        }
        {
            const result = await sameTypeAction(toFormData({ a: 'banana' }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(1);
        }

        const differentTypeScheme = z.object({
            a: z.boolean().transform(v => !!v ? 'yay' : 'nay'),
        });

        const differentTypeAction =
            serverAction(differentTypeScheme, async (data) => { value = data.a; ++invocations; });

        {
            const result = await differentTypeAction(toFormData({ a: undefined }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(1);
        }
        {
            const result = await differentTypeAction(toFormData({ a: true }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(2);
            expect(value).toBe('yay');
        }
        {
            const result = await differentTypeAction(toFormData({ a: false }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(3);
            expect(value).toBe('nay');
        }
        {
            const result = await differentTypeAction(toFormData({ a: 'banana' }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(3);
        }
    });

    it('should fail invocations where an exception is thrown', async () => {
        // TODO: Implement this test
    });

    it('should represent uploaded files as File instances', async () => {
        let value: any;
        let invocations = 0;

        const data = new ArrayBuffer(/* byteLength= */ 8);
        const dataUint32 = new Uint32Array(data);
        dataUint32[0] = 1048576;
        dataUint32[1] = 2097152;

        const scheme = z.object({ a: z.instanceof(Blob) });
        const action = serverAction(scheme, async (data) => { value = data.a; ++invocations; });

        {
            const result = await action(toFormData({ /* missing property */ }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);
        }
        {
            const result = await action(toFormData({ a: undefined }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);
        }
        {
            const result = await action(toFormData({ a: null }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);
        }
        {
            const result = await action(toFormData({ a: 'filez' }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(0);
        }
        {
            const result = await action(toFormData({
                a: new Blob([ data ], { type: 'image/png' })
            }));

            expect(result.success).toBeTrue();
            expect(invocations).toBe(1);
            expect(value).toBeInstanceOf(Blob);
            expect(value.size).toBe(8);
            expect(value.type).toBe('image/png');
        }
        {
            const result = await action(toFormData({
                a: new File([ data ], 'myfile.jpg', { type: 'image/jpg' })
            }));

            expect(result.success).toBeTrue();
            expect(invocations).toBe(2);
            expect(value).toBeInstanceOf(Blob);
            expect(value.size).toBe(8);
            expect(value.type).toBe('image/jpg');
        }

        const nullableScheme = z.object({ a: z.instanceof(Blob).nullable() });
        const nullableAction =
            serverAction(nullableScheme, async (data) => { value = data.a; ++invocations; });

        {
            const result = await nullableAction(toFormData({ /* missing property */ }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(2);
        }
        {
            const result = await nullableAction(toFormData({ a: undefined }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(2);
        }
        {
            const result = await nullableAction(toFormData({ a: null }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(3);
            expect(value).toBeNull();
        }
        {
            const result = await nullableAction(toFormData({ a: 'filez' }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(3);
        }
        {
            const result = await nullableAction(toFormData({
                a: new Blob([ data ], { type: 'image/png' })
            }));

            expect(result.success).toBeTrue();
            expect(invocations).toBe(4);
            expect(value).toBeInstanceOf(Blob);
            expect(value.size).toBe(8);
            expect(value.type).toBe('image/png');
        }
        {
            const result = await nullableAction(toFormData({
                a: new File([ data ], 'myfile.jpg', { type: 'image/jpg' })
            }));

            expect(result.success).toBeTrue();
            expect(invocations).toBe(5);
            expect(value).toBeInstanceOf(Blob);
            expect(value.size).toBe(8);
            expect(value.type).toBe('image/jpg');
        }

        const optionalScheme = z.object({ a: z.instanceof(Blob).optional() });
        const optionalAction =
            serverAction(optionalScheme, async (data) => { value = data.a; ++invocations; });

        {
            const result = await optionalAction(toFormData({ /* missing property */ }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(6);
            expect(value).toBeUndefined();
        }
        {
            const result = await optionalAction(toFormData({ a: undefined }));
            expect(result.success).toBeTrue();
            expect(invocations).toBe(7);
            expect(value).toBeUndefined();
        }
        {
            const result = await optionalAction(toFormData({ a: null }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(7);
        }
        {
            const result = await optionalAction(toFormData({ a: 'filez' }));
            expect(result.success).toBeFalse();
            expect(invocations).toBe(7);
        }
        {
            const result = await optionalAction(toFormData({
                a: new Blob([ data ], { type: 'image/png' })
            }));

            expect(result.success).toBeTrue();
            expect(invocations).toBe(8);
            expect(value).toBeInstanceOf(Blob);
            expect(value.size).toBe(8);
            expect(value.type).toBe('image/png');
        }
        {
            const result = await optionalAction(toFormData({
                a: new File([ data ], 'myfile.jpg', { type: 'image/jpg' })
            }));

            expect(result.success).toBeTrue();
            expect(invocations).toBe(9);
            expect(value).toBeInstanceOf(Blob);
            expect(value.size).toBe(8);
            expect(value.type).toBe('image/jpg');
        }
    });
});

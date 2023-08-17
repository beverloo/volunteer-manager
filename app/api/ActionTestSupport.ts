// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import type { ZodObject, ZodRawShape } from 'zod';
import { z } from 'zod';

import type { Action } from './Action';
import { User, type UserDatabaseRow } from '@app/lib/auth/User';
import { executeAction } from './Action';

/**
 * Parameters accepted by the `executeActionForTests` function.
 */
export interface InvokeActionParams<T extends ZodObject<ZodRawShape, any, any>> {
    /**
     * The request that should be issued when executing the action.
     */
    request: z.infer<T>['request'];

    /**
     * The user who should be signed in while executing the action. When a dictionary is passed with
     * any properties set then a User instance will be created, otherwise this will be a visitor.
     */
    user?: Partial<UserDatabaseRow>;
}

/**
 * Executes the given `action` with the given parameters (`params`). The parameters
 */
export async function executeActionForTests<T extends ZodObject<ZodRawShape, any, any>>(
    api: T, action: Action<T>, params: InvokeActionParams<T>): Promise<NextResponse>
{
    let userForTesting: User | undefined;
    if (typeof params.user !== 'undefined') {
        userForTesting = new User({
            user_id: 1,
            username: 'foo@bar.com',
            first_name: 'Foo',
            last_name: 'Bar',
            gender: 'Other',
            birthdate: '2023-08-17',
            phone_number: '',
            avatar_file_hash: undefined,
            privileges: 0,
            session_token: 0,

            ...params.user,
        });
    }

    const request = new class extends NextRequest {
        set url(value: any) {
            // "TypeError: Cannot set property url of #<NextRequest> which has only a getter"
        }
    }('https://animecon.team/api/unit-test', {
        body: JSON.stringify(params.request),
        method: 'POST',
        headers: [
            [ 'x-forwarded-for', '127.0.0.1' ],
        ],
    });

    return await executeAction(request, api, action, userForTesting);
}

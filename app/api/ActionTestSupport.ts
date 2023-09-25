// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import type { ZodObject, ZodRawShape } from 'zod';
import type { z } from 'zod';

import type { Action } from './Action';
import { AuthType } from '@lib/database/Types';
import { User, type UserDatabaseRow } from '@lib/auth/User';
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
            userId: 1,
            username: 'foo@bar.com',
            firstName: 'Foo',
            lastName: 'Bar',
            avatarUrl: undefined,
            privileges: 0n,

            // TODO: Remove these fields:
            authTypeForCredentialBasedAuthentication: AuthType.password,
            events: [],
            sessionToken: 0,

            ...params.user,
        });
    }

    const request = new class extends NextRequest {
        override set url(value: any) {
            // "TypeError: Cannot set property url of #<NextRequest> which has only a getter"
        }
    }('https://animecon.team/api/unit-test', {
        body: JSON.stringify(params.request),
        method: 'POST',
        headers: [
            [ 'x-forwarded-for', '127.0.0.1' ],
        ],
    });

    return await executeAction(request, api, action, /* routeParams= */ undefined, userForTesting);
}

/**
 * Parameters accepted by the `injectPermissionTestsForAction` function.
 */
export interface InjectPermissionTestsForActionParams<T extends ZodObject<ZodRawShape, any, any>> {
    /**
     * The request that should be issued when executing the action.
     */
    request: z.infer<T>['request'];

    /**
     * Privileges to be assigned to a user that are considered insufficient to call the API.
     */
    insufficientPrivileges: number;
}

/**
 * Injects a permission test for the given action. Two assertions will be made:
 *     1. Invoking the |action| without authentication yields a 403 Forbidden,
 *     2. Invoking the |action| with the insufficient privileges yields a 403 Forbidden.
 */
export async function injectPermissionTestsForAction<T extends ZodObject<ZodRawShape, any, any>>(
    api: T, action: Action<T>, params: InjectPermissionTestsForActionParams<T>): Promise<void>
{
    it(`requires sufficient privileges (${action.name})`, async () => {
        const guestResponse = await executeActionForTests(api, action, {
            request: params.request,
            user: /* guest= */ undefined,
        });

        expect(guestResponse.ok).toBeFalsy();
        expect(guestResponse.status).toBe(/* Forbidden= */ 403);

        const userResponse = await executeActionForTests(api, action, {
            request: params.request,
            user: {
                privileges: BigInt(params.insufficientPrivileges)
            },
        });

        expect(userResponse.ok).toBeFalsy();
        expect(userResponse.status).toBe(/* Forbidden= */ 403);
    });
}

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { writeEmptySessionCookie } from '@app/lib/auth/Session';

/**
 * Interface definition for the SignOut API, exposed through /api/auth/sign-out.
 */
export const kSignOutDefinition = z.object({
    request: z.object({ /* no request parameters */ }),
    response: z.strictObject({
        /**
         * Whether the sign out operation could be completed successfully.
         */
        success: z.boolean(),
    }),
});

export type SignOutDefinition = z.infer<typeof kSignOutDefinition>;

type Request = SignOutDefinition['request'];
type Response = SignOutDefinition['response'];

/**
 * API that signs the user out of their account by setting an empty authentication session cookie
 * that's due to expire right after receiving it. No verification is done in this method.
 */
export async function signOut(request: Request, props: ActionProps): Promise<Response> {
    await writeEmptySessionCookie(props.responseHeaders);
    return { success: true };
}

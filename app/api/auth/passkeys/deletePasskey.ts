// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../../Action';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { deleteCredential } from './PasskeyUtils';

/**
 * Interface definition for the Passkeys API, exposed through /api/auth/passkeys.
 */
export const kDeletePasskeyDefinition = z.object({
    request: z.object({
        /**
         * ID of the passkey that should be removed from the user's account.
         */
        id: z.number(),
    }),
    response: z.strictObject({
        /**
         * Whether the operation could be executed successfully.
         */
        success: z.boolean(),

        /**
         * Error message in case the operation failed.
         */
        error: z.string().optional(),
    }),
});

export type DeletePasskeyDefinition = z.infer<typeof kDeletePasskeyDefinition>;

type Request = DeletePasskeyDefinition['request'];
type Response = DeletePasskeyDefinition['response'];

/**
 * Deletes one of the user's earlier created passkeys.
 */
export async function deletePasskey(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user || !props.user.username)
        noAccess();

    const credentialDeleted = await deleteCredential(props.user, request.id);
    if (credentialDeleted) {
        await Log({
            type: LogType.AccountPasskeyCreate,
            severity: LogSeverity.Debug,
            sourceUser: props.user,
            data: { ip: props.ip },
        });
    }

    // Always return success -- regardless of `credentialDeleted`, the passkey no longer exists.
    return { success: true };
}

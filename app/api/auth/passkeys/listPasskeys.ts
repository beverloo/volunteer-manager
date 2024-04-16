// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { ApiDefinition, ApiRequest, ApiResponse } from '../../Types';
import { type ActionProps, noAccess } from '../../Action';
import { determineEnvironment } from '@lib/Environment';
import { formatDate } from '@lib/Temporal';
import { determineRpID, retrieveCredentials } from './PasskeyUtils';

/**
 * Interface definition for the Passkeys API, exposed through /api/auth/passkeys.
 */
export const kListPasskeysDefinition = z.object({
    request: z.object({ /* no parameters */ }),
    response: z.strictObject({
        /**
         * Whether the operation could be executed successfully.
         */
        success: z.boolean(),

        /**
         * Error message in case the operation failed.
         */
        error: z.string().optional(),

        /**
         * The passkeys that the user has associated with their account.
         */
        passkeys: z.array(z.object({
            /**
             * Unique ID of the passkey as it exists in the database.
             */
            id: z.number(),

            /**
             * Label, or name, that should be given to the passkey.
             */
            label: z.string(),

            /**
             * Description associated with the passkey, i.e. its last time of use.
             */
            description: z.string(),

        })).optional(),
    }),
});

export type ListPasskeysDefinition = ApiDefinition<typeof kListPasskeysDefinition>;

type Request = ApiRequest<typeof kListPasskeysDefinition>;
type Response = ApiResponse<typeof kListPasskeysDefinition>;

/**
 * Lists the passkeys associated with the signed in user's account.
 */
export async function listPasskeys(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user || !props.user.username)
        noAccess();

    const environment = await determineEnvironment();
    if (!environment)
        notFound();

    const rpID = determineRpID(props);

    const credentials = await retrieveCredentials(props.user, rpID);
    const passkeys = credentials.map(credential => {
        const label = credential.name ?? `Passkey #${credential.passkeyId}`;

        let description = `Created on ${formatDate(credential.created, 'DD/MM/YYYY')}`;
        if (credential.lastUsed)
            description += `, last used on ${formatDate(credential.lastUsed, 'DD/MM/YYYY')}`;

        return {
            id: credential.passkeyId,
            label, description,
        };
    });

    return {
        success: true,
        passkeys,
    };
}

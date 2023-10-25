// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { dayjs } from '@lib/DateTime';
import { notFound } from 'next/navigation';
import { z } from 'zod';

import { type ActionProps, noAccess } from '../../Action';
import { determineEnvironment } from '@lib/Environment';
import { retrieveCredentials } from './PasskeyUtils';

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

export type ListPasskeysDefinition = z.infer<typeof kListPasskeysDefinition>;

type Request = ListPasskeysDefinition['request'];
type Response = ListPasskeysDefinition['response'];

/**
 * Lists the passkeys associated with the signed in user's account.
 */
export async function listPasskeys(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user || !props.user.username)
        noAccess();

    const environment = await determineEnvironment();
    if (!environment)
        notFound();

    const credentials = await retrieveCredentials(props.user);
    const passkeys = credentials.map(credential => {
        const label = `Passkey #${credential.passkeyId}`;

        let description = `Created on ${dayjs(credential.created).format('DD/MM/YYYY')}`;
        if (credential.lastUsed)
            description += `, last used on ${dayjs(credential.lastUsed).format('DD/MM/YYYY')}`;

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

// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

/**
 * Type definition that defines the response we expect when calling the Organisers API.
 */
export const kYourTicketProviderOrganisersResponse = z.object({
    /**
     * Array of the response values.
     */
    value: z.array(z.object({
        /**
         * Unique ID of the organiser for whom information is being returned.
         */
        Id: z.number(),

        /**
         * First name of the organiser.
         */
        FirstName: z.string(),

        /**
         * Last name of the organiser.
         */
        LastName: z.string(),

        /**
         * E-mail address through which the organiser can be reached.
         */
        Email: z.string(),

        /**
         * API key that belongs to this organiser.
         */
        ApiKey: z.string().nullable(),
    })),
});

/**
 * Interface describing the data we expect from the Organisers API.
 */
export type YourTicketProviderOrganisersResponse =
    z.infer<typeof kYourTicketProviderOrganisersResponse>;

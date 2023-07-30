// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';

/**
 * Interface definition for the Application API, exposed through /api/event/application.
 */
export const kApplicationDefinition = z.object({
    request: z.object({
        /**
         * Whether the volunteer is fully available during the event.
         */
        availability: z.boolean(),

        /**
         * Whether the volunteer would like their name to be included in the credit reel.
         */
        credits: z.boolean(),

        /**
         * Unique slug of the event in which the volunteer would like to participate.
         */
        event: z.string(),

        /**
         * Preferences the volunteer has indicated for during their participation.
         */
        preferences: z.string().optional(),

        /**
         * Number of hours that the volunteer would like to help us out with.
         */
        serviceHours: z.enum([ '12', '16', '20', '24' ]),

        /**
         * Timing of the shifts the volunteer would like to fulfill.
         */
        serviceTiming: z.enum([ '8-20', '10-0', '14-3' ]),

        /**
         * Whether the volunteer would like to join our social media channels.
         */
        socials: z.boolean(),

        /**
         * Fit for the t-shirt that the volunteer would like to receive as a thank you.
         */
        tshirtFit: z.enum([ 'Regular', 'Girly' ]),

        /**
         * Size of the t-shirt that the volunteer would like to receive as a thank you.
         */
        tshirtSize: z.enum([ 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL' ]),
    }),
    response: z.strictObject({
        /**
         * Whether the application has been successfully submitted.
         */
        success: z.boolean(),

        /**
         * Reason why the application's submission may have failed.
         */
        error: z.string().optional(),
    }),
});

export type ApplicationDefinition = z.infer<typeof kApplicationDefinition>;

type Request = ApplicationDefinition['request'];
type Response = ApplicationDefinition['response'];

/**
 * API through which volunteers can apply to participate in one of our events. Applications have to
 * be manually approved (or rejected) by senior volunteers.
 */
export async function application(request: Request, props: ActionProps): Promise<Response> {
    return { success: false, error: 'Not implemented.' };
}
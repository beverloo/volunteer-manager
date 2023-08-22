// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import type { Environment } from '@app/Environment';
import { Privilege, can } from '@lib/auth/Privileges';
import { createRegistration, getRegistration } from '@lib/RegistrationLoader';
import { getEventBySlug } from '@lib/EventLoader';
import { getRequestEnvironment } from '@app/lib/getRequestEnvironment';

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

        /**
         * Override configuration that can be provided when an application is being created through
         * the administration panel. Only people with application management permission can do this.
         */
        adminOverride: z.strictObject({
            /**
             * The environment that this request is being submitted as.
             */
            environment: z.string(),

            /**
             * The user Id for whom the application is being created.
             */
            userId: z.number(),
        }).optional(),
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
    try {
        if (!props.user)
            throw new Error('Sorry, you need to log in to your account first.');

        const event = await getEventBySlug(request.event);
        if (!event)
            throw new Error('Sorry, something went wrong (unable to find the right event)...');

        let environment = getRequestEnvironment();
        let userId: number = props.user.userId;

        if (request.adminOverride) {
            if (!can(props.user, Privilege.EventApplicationManagement) &&
                !can(props.user, Privilege.EventAdministrator))
            {
                throw new Error('Sorry, you do not have permission to impersonate users.');
            }

            environment = request.adminOverride.environment as Environment;
            userId = request.adminOverride.userId;
        } else {
            const environmentData = event.getEnvironmentData(environment);
            if (!environmentData)
                throw new Error('Sorry, something went wrong (unable to find the environment)...');

            if (!environmentData.enableRegistration &&
                    !can(props.user, Privilege.EventRegistrationOverride)) {
                throw new Error('Sorry, this event is not accepting applications right now.');
            }
        }

        const registration = await getRegistration(environment, event, userId);
        if (registration)
            throw new Error('Sorry, you have already applied to participate in this event.');

        await createRegistration(environment, event, userId, request);

        // TODO: Send an e-mail to the volunteering leads.
        // TODO: Send an e-mail to the applicant.

        return { success: true };

    } catch (error) {
        console.error('Unable to accept an application:', error);
        return { success: false, error: (error as Error).message };
    }
}

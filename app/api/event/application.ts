// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import type { EnvironmentDomain } from '@lib/Environment';
import { Log, LogSeverity, LogType } from '@lib/Log';
import { Publish, SubscriptionType } from '@lib/subscriptions';
import { SendEmailTask } from '@lib/scheduler/tasks/SendEmailTask';
import { ShirtFit, ShirtSize } from '@lib/database/Types';
import { createRegistration, getRegistration } from '@lib/RegistrationLoader';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import { getStaticContent } from '@lib/Content';
import db, { tTeams } from '@lib/database';

/**
 * Number of hours that the volunteer would like to help us out with.
 */
export const kServiceHoursProperty = z.enum([ '12', '16', '20', '24' ]);

/**
 * Timing of the shifts the volunteer would like to fulfill.
 */
export const kServiceTimingProperty = z.enum([ '8-20', '10-0', '14-3' ]);

/**
 * Common properties that can be set or updated as part of applications.
 */
export const kApplicationProperties = {
    /**
     * Whether the volunteer would like their name to be included in the credit reel.
     */
    credits: z.boolean(),

    /**
     * Whether the volunteer would like to join our social media channels.
     */
    socials: z.boolean(),

    /**
     * Fit for the t-shirt that the volunteer would like to receive as a thank you.
     */
    tshirtFit: z.nativeEnum(ShirtFit),

    /**
     * Size of the t-shirt that the volunteer would like to receive as a thank you.
     */
    tshirtSize: z.nativeEnum(ShirtSize),
};

/**
 * Interface definition for the Application API, exposed through /api/event/application.
 */
export const kApplicationDefinition = z.object({
    request: z.object({
        ...kApplicationProperties,

        /**
         * Preferences the volunteer has indicated for during their participation.
         */
        preferences: z.string().optional(),

        /**
         * Number of hours that the volunteer would like to help us out with.
         */
        serviceHours: kServiceHoursProperty,

        /**
         * Timing of the shifts the volunteer would like to fulfill.
         */
        serviceTiming: kServiceTimingProperty,

        /**
         * Whether the volunteer is fully available during the event.
         */
        availability: z.boolean(),

        /**
         * Unique slug of the event in which the volunteer would like to participate.
         */
        event: z.string(),

        /**
         * Unique slug of the team in which the volunteer would like to participate.
         */
        team: z.string(),

        /**
         * Override configuration that can be provided when an application is being created through
         * the administration panel. Only people with application management permission can do this.
         */
        adminOverride: z.strictObject({
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

export type ApplicationDefinition = ApiDefinition<typeof kApplicationDefinition>;

type Request = ApiRequest<typeof kApplicationDefinition>;
type Response = ApiResponse<typeof kApplicationDefinition>;

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

        const team = await db.selectFrom(tTeams)
            .where(tTeams.teamSlug.equals(request.team))
            .select({
                id: tTeams.teamId,
                environment: tTeams.teamEnvironment,
                name: tTeams.teamName,
                slug: tTeams.teamSlug,
                title: tTeams.teamTitle,
            })
            .executeSelectNoneOrOne();

        if (!team)
            throw new Error('Sorry, something went wrong (unable to find the right team)...');

        const environmentDomain = team.environment as EnvironmentDomain;

        let userId: number = props.user.userId;
        if (request.adminOverride) {
            executeAccessCheck(props.authenticationContext, {
                check: 'admin-event',
                event: request.event,
                permission: {
                    permission: 'event.applications',
                    operation: 'create',
                    scope: {
                        event: event.slug,
                        team: team.slug,
                    },
                },
            });

            userId = request.adminOverride.userId;

        } else {
            const environmentData = event.getEnvironmentData(environmentDomain);
            if (!environmentData)
                throw new Error('Sorry, something went wrong (unable to find the environment)...');

            if (!environmentData.enableApplications &&
                    !props.access.can('event.visible', { event: event.slug, team: team.slug })) {
                throw new Error('Sorry, this event is not accepting applications right now.');
            }
        }

        const registration = await getRegistration(environmentDomain, event, userId);
        if (registration)
            throw new Error('Sorry, you have already applied to participate in this event.');

        await createRegistration(environmentDomain, event, userId, request);
        if (request.adminOverride) {
            await Log({
                type: LogType.AdminEventApplication,
                severity: LogSeverity.Warning,
                sourceUser: props.user,
                targetUser: request.adminOverride.userId,
                data: {
                    event: event.shortName,
                }
            });
        } else {
            await Log({
                type: LogType.EventApplication,
                sourceUser: props.user,
                data: {
                    event: event.shortName,
                    ip: props.ip
                },
            });
        }

        // -----------------------------------------------------------------------------------------

        if (!request.adminOverride) {
            const applicationConfirmation =
                await getStaticContent([ 'message', 'application-confirmation' ], {
                    environment: team.environment,
                    event: event.shortName,
                    eventSlug: event.slug,
                    hostname: props.origin,
                    name: props.user.firstName,
                    team: team.title,
                    teamSlug: team.slug,
                });

            if (applicationConfirmation) {
                await SendEmailTask.Schedule({
                    sender: `AnimeCon ${team.title}`,
                    message: {
                        to: props.user.username!,
                        subject: applicationConfirmation.title,
                        markdown: applicationConfirmation.markdown,
                    },
                    attribution: {
                        sourceUserId: userId,
                        targetUserId: userId,
                    },
                });
            }

            await Publish({
                type: SubscriptionType.Application,
                typeId: team.id,
                sourceUserId: props.user.userId,
                message: {
                    userId: props.user.userId,
                    name: props.user.name,
                    event: event.shortName,
                    eventSlug: event.slug,
                    teamEnvironment: team.environment,
                    teamName: team.name,
                    teamSlug: team.slug,
                    teamTitle: team.title,
                },
            });
        }

        return { success: true };

    } catch (error) {
        console.error('Unable to accept an application:', error);
        return { success: false, error: (error as Error).message };
    }
}

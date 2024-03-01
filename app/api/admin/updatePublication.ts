// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { type ActionProps, noAccess } from '../Action';
import { Log, LogSeverity, LogType } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tEvents } from '@lib/database';

/**
 * Interface definition for the Event API, exposed through /api/admin/update-publication.
 */
export const kUpdatePublicationDefinition = z.object({
    request: z.object({
        /**
         * Slug of the event for which information should be updated.
         */
        event: z.string(),

        /**
         * When set, will update whether hotel preferences can be shared by volunteers.
         */
        publishHotels: z.boolean().optional(),

        /**
         * When set, will update whether the availability for refunds is being advertised.
         */
        publishRefunds: z.boolean().optional(),

        /**
         * When set, will update whether training preferences can be shared by volunteers.
         */
        publishTrainings: z.boolean().optional(),
    }),
    response: z.strictObject({
        /**
         * Whether the API call was able to execute successfully.
         */
        success: z.boolean(),
    }),
});

export type UpdatePublicationDefinition = ApiDefinition<typeof kUpdatePublicationDefinition>;

type Request = ApiRequest<typeof kUpdatePublicationDefinition>;
type Response = ApiResponse<typeof kUpdatePublicationDefinition>;

/**
 * API that allows information about the publication state of a particular event setting to be
 * updated. Generally this will be about availability, hotel and training infomration.
 */
export async function updatePublication(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin-event',
        event: request.event,
    });

    const updates: {
        publishHotels?: number;
        publishRefunds?: number;
        publishTrainings?: number;
    } = { /* no updates */ };

    const eventName = await db.selectFrom(tEvents)
        .selectOneColumn(tEvents.eventShortName)
        .where(tEvents.eventSlug.equals(request.event))
        .executeSelectNoneOrOne();

    if (!eventName)
        notFound();

    if (request.publishHotels !== undefined) {
        if (!can(props.user, Privilege.EventHotelManagement))
            noAccess();

        updates.publishHotels = !!request.publishHotels ? 1 : 0;
        await Log({
            type: LogType.AdminEventPublishInfo,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            data: {
                event: eventName,
                published: !!request.publishHotels,
                type: 'hotel',
            },
        });
    }

    if (request.publishRefunds !== undefined) {
        if (!can(props.user, Privilege.Refunds))
            noAccess();

        updates.publishRefunds = !!request.publishRefunds ? 1 : 0;
        await Log({
            type: LogType.AdminEventPublishInfo,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            data: {
                event: eventName,
                published: !!request.publishRefunds,
                type: 'refund',
            },
        });
    }

    if (request.publishTrainings !== undefined) {
        if (!can(props.user, Privilege.EventTrainingManagement))
            noAccess();

        updates.publishTrainings = !!request.publishTrainings ? 1 : 0;
        await Log({
            type: LogType.AdminEventPublishInfo,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            data: {
                event: eventName,
                published: !!request.publishTrainings,
                type: 'training',
            },
        });
    }

    if (!Object.keys(updates).length)
        return { success: false };

    await db.update(tEvents)
        .set(updates)
        .where(tEvents.eventSlug.equals(request.event))
        .executeUpdate(/* min= */ 0, /* max= */ 1);

    return { success: true };
}

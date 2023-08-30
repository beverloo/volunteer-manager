// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { LogType, Log, LogSeverity } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tEvents } from '@lib/database';

/**
 * Interface definition for the Event API, exposed through /api/admin/update-event.
 */
export const kUpdateEventDefinition = z.object({
    request: z.object({
        /**
         * Slug of the event that should be updated.
         */
        event: z.string(),

        /**
         * Whether the event should be hidden. Will be updated when set to a value.
         */
        eventHidden: z.boolean().optional(),

        /**
         * Event settings that should be updated, if any.
         */
        eventSettings: z.object({
            /**
             * Full name of the event as it should be presented to visitors.
             */
            name: z.string(),

            /**
             * Short name of the event as it should be presented to visitors.
             */
            shortName: z.string(),

            /**
             * ISO date and time at which the event should start.
             */
            startTime: z.string(),

            /**
             * ISO date and time at which the event should finish.
             */
            endTime: z.string(),

        }).optional(),

    }),
    response: z.strictObject({
        /**
         * Whether the event could be updated successfully.
         */
        success: z.boolean(),
    }),
});

export type UpdateEventDefinition = z.infer<typeof kUpdateEventDefinition>;

type Request = UpdateEventDefinition['request'];
type Response = UpdateEventDefinition['response'];

/**
 * API that allows administrators to update information related to an event, or the teams that do
 * participate in an event. Only event administrators have the rights to use this page.
 */
export async function updateEvent(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.EventAdministrator))
        noAccess();

    const event = await getEventBySlug(request.event);
    if (!event)
        notFound();

    if (request.eventHidden !== undefined) {
        const affectedRows = await db.update(tEvents)
            .set({
                eventHidden: request.eventHidden ? 1 : 0,
            })
            .where(tEvents.eventId.equals(event.eventId))
            .executeUpdate(/* min= */ 0, /* max= */ 1);

        if (affectedRows > 0) {
            await Log({
                type: LogType.AdminUpdateEvent,
                severity: LogSeverity.Warning,
                sourceUser: props.user,
                data: {
                    action: 'the publication status',
                    event: event.shortName,
                }
            });
        }

        return { success: !!affectedRows };
    }

    if (request.eventSettings !== undefined) {
        const affectedRows = await db.update(tEvents)
            .set({
                eventName: request.eventSettings.name,
                eventShortName: request.eventSettings.shortName,
                eventStartTime: new Date(request.eventSettings.startTime),
                eventEndTime: new Date(request.eventSettings.endTime),
            })
            .where(tEvents.eventId.equals(event.eventId))
            .executeUpdate(/* min= */ 0, /* max= */ 1);

        if (affectedRows > 0) {
            await Log({
                type: LogType.AdminUpdateEvent,
                severity: LogSeverity.Warning,
                sourceUser: props.user,
                data: {
                    action: 'event settings',
                    event: event.shortName,
                }
            });
        }

        return { success: !!affectedRows };
    }

    return { success: true };
}

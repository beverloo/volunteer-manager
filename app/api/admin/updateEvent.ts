// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { FileType } from '@lib/database/Types';
import { LogType, Log, LogSeverity } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { getEventBySlug } from '@lib/EventLoader';
import { storeBlobData } from '@lib/database/BlobStore';
import db, { tContent, tEvents, tEventsTeams } from '@lib/database';

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
         * The event identity image, encoded in the PNG format, represented as a string.
         */
        eventIdentity: z.string().optional(),

        /**
         * Event settings that should be updated, if any.
         */
        eventSettings: z.object({
            name: z.string(),
            shortName: z.string(),
            startTime: z.string(),
            endTime: z.string(),
        }).optional(),

        /**
         * The updated event slug that this event should be changed to.
         */
        eventSlug: z.string().optional(),

        /**
         * The team that should be updated as part of this event's settings.
         */
        team: z.object({
            id: z.number(),

            enableTeam: z.boolean(),
            enableContent: z.boolean(),
            enableRegistration: z.boolean(),
            enableSchedule: z.boolean(),
            targetSize: z.number(),
        }).optional(),
    }),
    response: z.strictObject({
        /**
         * Whether the event could be updated successfully.
         */
        success: z.boolean(),

        /**
         * The new slug, if it were successfully updated in the database.
         */
        slug: z.string().optional(),
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

    if (request.eventIdentity !== undefined) {
        const eventIdentityId = await storeBlobData({
            bytes: Buffer.from(request.eventIdentity, 'base64'),
            mimeType: 'image/png',
            type: FileType.EventIdentity,
        });

        if (eventIdentityId !== false) {
            const affectedRows = await db.update(tEvents)
                .set({ eventIdentityId })
                .where(tEvents.eventId.equals(event.eventId))
                .executeUpdate(/* min= */ 0, /* max= */ 1);

            if (!!affectedRows) {
                await Log({
                    type: LogType.AdminUpdateEvent,
                    severity: LogSeverity.Info,
                    sourceUser: props.user,
                    data: {
                        action: 'the identity image',
                        event: event.shortName,
                    },
                });
            }

            return { success: !!affectedRows };
        }

        return { success: false };
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

    if (request.eventSlug !== undefined) {
        const otherEvent = await getEventBySlug(request.eventSlug);
        if (otherEvent)
            return { success: false };  // the new slug is already taken

        const affectedRows = await db.update(tEvents)
            .set({
                eventSlug: request.eventSlug,
            })
            .where(tEvents.eventId.equals(event.eventId))
            .executeUpdate(/* min= */ 0, /* max= */ 1);

        if (affectedRows > 0) {
            await Log({
                type: LogType.AdminUpdateEvent,
                severity: LogSeverity.Warning,
                sourceUser: props.user,
                data: {
                    action: 'the URL slug',
                    event: event.shortName,
                }
            });
        }

        return { success: !!affectedRows, slug: request.eventSlug };
    }

    if (request.team !== undefined) {
        const dbInstance = db;
        const success = await dbInstance.transaction(async () => {
            if (!request.team)
                return false;  // microtasks, you know...

            const affectedRows = await dbInstance.insertInto(tEventsTeams)
                .set({
                    eventId: event.eventId,
                    teamId: request.team.id,
                    teamTargetSize: request.team.targetSize,
                    enableTeam: request.team.enableTeam ? 1 : 0,
                    enableContent: request.team.enableContent ? 1 : 0,
                    enableRegistration: request.team.enableRegistration ? 1 : 0,
                    enableSchedule: request.team.enableSchedule ? 1 : 0,
                })
                .onConflictDoUpdateSet({
                    teamTargetSize: request.team.targetSize,
                    enableTeam: request.team.enableTeam ? 1 : 0,
                    enableContent: request.team.enableContent ? 1 : 0,
                    enableRegistration: request.team.enableRegistration ? 1 : 0,
                    enableSchedule: request.team.enableSchedule ? 1 : 0,
                })
                .executeInsert(/* min= */ 0, /* max= */ 1);

            if (!!affectedRows && request.team.enableTeam) {
                const pages = [
                    { contentPath: '', contentTitle: event.shortName },
                    { contentPath: 'application', contentTitle: 'Apply to join' },
                ];

                await dbInstance.insertInto(tContent)
                    .values(pages.map((pageProps) => ({
                        eventId: event.eventId,
                        teamId: request.team!.id,
                        content: 'No content has been written yet…',
                        contentProtected: 1,
                        revisionAuthorId: props.user!.userId,
                        revisionVisible: 1,
                        ...pageProps,
                    })))
                    .onConflictDoNothing()
                    .executeInsert();
            }

            return !!affectedRows;
        });

        if (success) {
            await Log({
                type: LogType.AdminUpdateEvent,
                severity: LogSeverity.Warning,
                sourceUser: props.user,
                data: {
                    action: 'team settings',
                    event: event.shortName,
                    team: request.team.id,
                }
            });
        }

        return { success };
    }

    return { success: false };
}

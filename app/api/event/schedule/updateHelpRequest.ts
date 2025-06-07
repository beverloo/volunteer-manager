// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod/v4';

import type { ActionProps } from '../../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../../Types';
import { RecordLog, kLogSeverity, kLogType } from '@lib/Log';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tDisplays, tDisplaysRequests, tUsers } from '@lib/database';

import { kDisplayHelpRequestStatus } from '@lib/database/Types';

/**
 * Interface definition for the Schedule API, exposed through /api/event/schedule/help-request
 */
export const kUpdateHelpRequestDefinition = z.object({
    request: z.object({
        /**
         * Unique slug of the event to which the help request belongs.
         */
        event: z.string(),

        /**
         * Unique ID of the help request that is to be updated.
         */
        requestId: z.number(),

        /**
         * Whether the request is to be acknowledged by the signed in user.
         */
        acknowledge: z.object({}).optional(),

        /**
         * Whether the request is to be closed by the signed in user.
         */
        close: z.object({
            /**
             * The reason with which the request should be closed.
             */
            reason: z.string().min(1),

        }).optional(),
    }),
    response: z.strictObject({
        /**
         * Whether the help request was updated successfully.
         */
        success: z.boolean(),

        /**
         * Error message when something went wrong. Will be presented to the user.
         */
        error: z.string().optional(),
    }),
});

export type UpdateHelpRequestDefinition = ApiDefinition<typeof kUpdateHelpRequestDefinition>;

type Request = ApiRequest<typeof kUpdateHelpRequestDefinition>;
type Response = ApiResponse<typeof kUpdateHelpRequestDefinition>;

/**
 * API through which a help request can be updated for a particular event.
 */
export async function updateHelpRequest(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user || !props.authenticationContext.user)
        notFound();

    if (!props.access.can('event.help-requests', { event: request.event }))
        notFound();

    const event = await getEventBySlug(request.event);
    if (!event)
        notFound();

    const acknowledgedUserJoin = tUsers.forUseInLeftJoinAs('auj');
    const closedUserJoin = tUsers.forUseInLeftJoinAs('cuj');

    const helpRequest = await db.selectFrom(tDisplaysRequests)
        .innerJoin(tDisplays)
            .on(tDisplays.displayId.equals(tDisplaysRequests.displayId))
        .leftJoin(acknowledgedUserJoin)
            .on(acknowledgedUserJoin.userId.equals(tDisplaysRequests.requestAcknowledgedBy))
        .leftJoin(closedUserJoin)
            .on(closedUserJoin.userId.equals(tDisplaysRequests.requestClosedBy))
        .where(tDisplaysRequests.requestId.equals(request.requestId))
            .and(tDisplaysRequests.requestEventId.equals(event.id))
        .select({
            display: tDisplays.displayLabel.valueWhenNull(tDisplays.displayIdentifier),
            displayId: tDisplays.displayId,
            acknowledgedBy: acknowledgedUserJoin.name,
            closedBy: closedUserJoin.name,
        })
        .executeSelectNoneOrOne();

    if (!helpRequest)
        notFound();

    if (!!request.acknowledge) {
        if (!!helpRequest.acknowledgedBy) {
            return {
                success: false,
                error: `${helpRequest.acknowledgedBy} is already on their way!`
            };
        }

        const dbInstance = db;
        await dbInstance.transaction(async () => {
            await dbInstance.update(tDisplays)
                .set({
                    displayHelpRequestStatus: kDisplayHelpRequestStatus.Acknowledged,
                })
                .where(tDisplays.displayId.equals(helpRequest.displayId))
                .executeUpdate();

            await dbInstance.update(tDisplaysRequests)
                .set({
                    requestAcknowledgedBy: props.user!.id,
                    requestAcknowledgedDate: dbInstance.currentZonedDateTime(),
                })
                .where(tDisplaysRequests.requestId.equals(request.requestId))
                .executeUpdate();
        });

        RecordLog({
            type: kLogType.EventHelpRequestUpdate,
            severity: kLogSeverity.Warning,
            sourceUser: props.user,
            data: {
                display: helpRequest.display,
                event: event.shortName,
                mutation: 'Acknowledged',
            },
        });

        return { success: true };
    }

    if (!!request.close) {
        if (!!helpRequest.closedBy) {
            return {
                success: false,
                error: `${helpRequest.closedBy} has already closed the request!`,
            };
        }

        const dbInstance = db;
        await dbInstance.transaction(async () => {
            await dbInstance.update(tDisplays)
                .set({
                    displayHelpRequestStatus: /* reset= */ null,
                })
                .where(tDisplays.displayId.equals(helpRequest.displayId))
                .executeUpdate();

            await dbInstance.update(tDisplaysRequests)
                .set({
                    requestClosedBy: props.user!.id,
                    requestClosedDate: dbInstance.currentZonedDateTime(),
                    requestClosedReason: request.close!.reason,
                })
                .where(tDisplaysRequests.requestId.equals(request.requestId))
                .executeUpdate();
        });

        RecordLog({
            type: kLogType.EventHelpRequestUpdate,
            severity: kLogSeverity.Warning,
            sourceUser: props.user,
            data: {
                display: helpRequest.display,
                event: event.shortName,
                mutation: 'Closed',
            },
        });

        return { success: true };
    }

    return { success: false };
}

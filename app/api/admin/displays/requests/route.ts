// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../createDataTableApi';
import { DisplayHelpRequestTarget } from '@lib/database/Types';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tDisplays, tDisplaysRequests, tEvents, tUsers } from '@lib/database';

/**
 * Row model for an individual help request issued for a display.
 */
const kDisplayRequestRowModel = z.object({
    /**
     * Unique ID of the request as it exists in the database.
     */
    id: z.number(),

    /**
     * Date and time at which the request was received, in Temporal ZDT-compatible formatting.
     */
    date: z.string(),

    /**
     * Team / individual target of the received help request.
     */
    target: z.nativeEnum(DisplayHelpRequestTarget),

    /**
     * Name of the display from which the request was issued.
     */
    display: z.string(),

    /**
     * Name of the event for which the request was issued.
     */
    event: z.string(),

    /**
     * Name, user ID and date of the time that the request was acknowledged.
     */
    acknowledgedBy: z.string().optional(),
    acknowledgedByUserId: z.number().optional(),
    acknowledgedDate: z.string().optional(),

    /**
     * Name, user ID, date and reason of the time that the request was closed.
     */
    closedBy: z.string().optional(),
    closedByUserId: z.number().optional(),
    closedDate: z.string().optional(),
    closedReason: z.string().optional(),
});

/**
 * This API has no context requirements.
 */
const kDisplayRequestContext = z.never();

/**
 * Export type definitions so that the API can be used in `callApi()`.
 */
export type DisplayRequestsEndpoints =
    DataTableEndpoints<typeof kDisplayRequestRowModel, typeof kDisplayRequestContext>;

/**
 * Export type definition for the API's Row Model.
 */
export type DisplayRequestRowModel = z.infer<typeof kDisplayRequestRowModel>;

/**
 * This is implemented as a regular DataTable API. The following endpoints are provided by this
 * implementation:
 *
 *     GET    /api/admin/displays/requests
 */
export const { GET } = createDataTableApi(kDisplayRequestRowModel, kDisplayRequestContext, {
    async accessCheck(request, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin',
            permission: 'system.displays',
        });
    },

    async list({ pagination, sort }) {
        const acknowledgedUserJoin = tUsers.forUseInLeftJoinAs('auj');
        const closedUserJoin = tUsers.forUseInLeftJoinAs('cuj');

        const dbInstance = db;
        const requests = await dbInstance.selectFrom(tDisplaysRequests)
            .innerJoin(tDisplays)
                .on(tDisplays.displayId.equals(tDisplaysRequests.displayId))
            .innerJoin(tEvents)
                .on(tEvents.eventId.equals(tDisplaysRequests.requestEventId))
            .leftJoin(acknowledgedUserJoin)
                .on(acknowledgedUserJoin.userId.equals(tDisplaysRequests.requestAcknowledgedBy))
            .leftJoin(closedUserJoin)
                .on(closedUserJoin.userId.equals(tDisplaysRequests.requestClosedBy))
            .select({
                id: tDisplaysRequests.requestId,
                date: dbInstance.dateTimeAsString(tDisplaysRequests.requestReceivedDate),
                target: tDisplaysRequests.requestReceivedTarget,
                display: tDisplays.displayLabel.valueWhenNull(tDisplays.displayIdentifier),
                event: tEvents.eventShortName,

                acknowledgedBy: acknowledgedUserJoin.name,
                acknowledgedByUserId: acknowledgedUserJoin.userId,
                acknowledgedDate: dbInstance.dateTimeAsString(
                    tDisplaysRequests.requestAcknowledgedDate),

                closedBy: closedUserJoin.name,
                closedByUserId: closedUserJoin.userId,
                closedDate: dbInstance.dateTimeAsString(tDisplaysRequests.requestClosedDate),
                closedReason: tDisplaysRequests.requestClosedReason,
            })
            .orderBy(sort?.field ?? 'date', sort?.sort ?? 'desc')
            .limitIfValue(pagination ? pagination.pageSize : null)
                .offsetIfValue(pagination ? pagination.page * pagination.pageSize : null)
            .executeSelectPage();

        return {
            success: true,
            rowCount: requests.count,
            rows: requests.data,
        };
    },
});

export const dynamic = 'force-dynamic';

// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../createDataTableApi';
import { Log, LogSeverity, LogType } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { Temporal } from '@lib/Temporal';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { readSetting } from '@lib/Settings';
import db, { tDisplays } from '@lib/database';

/**
 * Row model for an individual display.
 */
const kDisplaysRowModel = z.object({
    /**
     * Unique ID of the display as it exists in the database.
     */
    id: z.number(),

    /**
     * Unique identifier associated with this display. Generated at random.
     */
    identifier: z.string(),

    /**
     * Human-associated label identifying what the display is being used for.
     */
    label: z.string().optional(),

    /**
     * Unique ID of the event the display should be associated with.
     */
    eventId: z.number().optional(),

    /**
     * Unique ID of the location the display should be associated with.
     */
    locationId: z.number().optional(),

    /**
     * Last check-in performed by the device. (Temporal ZDT-compatible format.)
     */
    lastCheckIn: z.string(),

    /**
     * IP address using which the last check-in was performed.
     */
    lastCheckInIp: z.string(),

    /**
     * Whether the device is locked.
     */
    locked: z.boolean(),
});

/**
 * This API has no context requirements.
 */
const kDisplaysContext = z.never();

/**
 * Export type definitions so that the API can be used in `callApi()`.
 */
export type DisplaysEndpoints =
    DataTableEndpoints<typeof kDisplaysRowModel, typeof kDisplaysContext>;

/**
 * Export type definition for the API's Row Model.
 */
export type DisplaysRowModel = z.infer<typeof kDisplaysRowModel>;

/**
 * This is implemented as a regular DataTable API. The following endpoints are provided by this
 * implementation:
 *
 *     GET    /api/admin/displays
 *     DELETE /api/admin/displays/:id
 *     PUT    /api/admin/displays/:id
 */
export const { GET, DELETE, PUT } = createDataTableApi(kDisplaysRowModel, kDisplaysContext, {
    async accessCheck(request, action, props) {
        executeAccessCheck(props.authenticationContext, {
            privilege: Privilege.SystemDisplayAccess,
        });
    },

    async delete({ id }) {
        const dbInstance = db;
        const affectedRows = await dbInstance.update(tDisplays)
            .set({
                displayDeleted: dbInstance.currentZonedDateTime(),
            })
            .where(tDisplays.displayId.equals(id))
                .and(tDisplays.displayDeleted.isNull())
            .executeUpdate();

        return { success: !!affectedRows };
    },

    async list({ pagination }) {
        const maximumDaysSinceCheckIn = await readSetting('display-max-time-since-check-in-days');

        const currentDateTime = Temporal.Now.zonedDateTimeISO('utc');
        const minimumDateTime = currentDateTime.subtract({ days: maximumDaysSinceCheckIn });

        const dbInstance = db;
        const displays = await dbInstance.selectFrom(tDisplays)
            .select({
                id: tDisplays.displayId,
                identifier: tDisplays.displayIdentifier,
                label: tDisplays.displayLabel,
                eventId: tDisplays.displayEventId,
                locationId: tDisplays.displayLocationId,
                lastCheckIn: dbInstance.dateTimeAsString(tDisplays.displayCheckIn),
                lastCheckInIp: tDisplays.displayCheckInIp,
                locked: tDisplays.displayLocked.equals(/* true= */ 1)
            })
            .where(tDisplays.displayDeleted.isNull())
                .and(tDisplays.displayCheckIn.greaterThan(minimumDateTime))
            .orderBy('lastCheckIn', 'desc')
                .orderBy('label', 'asc')
            .limitIfValue(pagination?.pageSize)
                .offsetIfValue(pagination ? pagination.page * pagination.pageSize
                                          : undefined)
            .executeSelectPage();

        return {
            success: true,
            rowCount: displays.count,
            rows: displays.data,
        };
    },

    async update({ row }) {
        const affectedRows = await db.update(tDisplays)
            .set({
                displayLabel: row.label,
                displayEventId: !!row.eventId ? row.eventId : null,
                displayLocationId: !!row.locationId ? row.locationId : null,
                displayLocked: !!row.locked ? 1 : 0,
            })
            .where(tDisplays.displayId.equals(row.id))
                .and(tDisplays.displayDeleted.isNull())
            .executeUpdate();

        return { success: !!affectedRows };
    },

    async writeLog({ id }, mutation, props) {
        const displayInfo = await db.selectFrom(tDisplays)
            .where(tDisplays.displayId.equals(id))
            .select({
                identifier: tDisplays.displayIdentifier,
                label: tDisplays.displayLabel,
            })
            .executeSelectNoneOrOne();

        await Log({
            type: LogType.AdminDisplayMutation,
            severity: LogSeverity.Info,
            sourceUser: props.user,
            data: {
                identifier: displayInfo?.identifier,
                label: displayInfo?.label,
                mutation,
            },
        });
    },
});

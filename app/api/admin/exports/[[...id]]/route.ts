// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { Event } from '@lib/Event';
import { type DataTableEndpoints, createDataTableApi } from '../../../createDataTableApi';
import { ExportType, LogSeverity } from '@lib/database/Types';
import { LogType, Log } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { Temporal } from '@lib/Temporal';
import { executeAccessCheck, type AuthenticationContext } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import { hasAccessToExport } from '@app/admin/volunteers/exports/ExportPrivileges';
import { nanoid } from '@lib/nanoid';
import db, { tEvents, tExportsLogs, tExports, tUsers } from '@lib/database';

/**
 * Row model for a data export.
 */
const kExportRowModel = z.object({
    /**
     * Unique ID of the export.
     */
    id: z.number(),

    /**
     * The unique slug of the export. Always 16 characters in length.
     */
    slug: z.string().length(16),

    /**
     * Short name of the event this export belongs to.
     */
    event: z.string(),

    /**
     * The type of export this describes.
     */
    type: z.nativeEnum(ExportType),

    /**
     * Justification for the data export, should be a brief sentence at most.
     */
    justification: z.string().min(1),

    /**
     * Date on which the export was created.
     */
    createdOn: z.string(),

    /**
     * Name of the person who comissioned the export.
     */
    createdBy: z.string(),

    /**
     * User ID of the person who commissioned the export.
     */
    createdByUserId: z.number(),

    /**
     * Date at which the export will cease to be available.
     */
    expirationDate: z.string(),

    /**
     * Maximum number of views after which the export will expire.
     */
    expirationViews: z.number(),

    /**
     * Number of views that the export has received so far.
     */
    views: z.number(),

    /**
     * Whether the export is enabled. This is separate from the expiration date and view limits.
     */
    enabled: z.boolean(),
});

/**
 * The Export API does not require any context.
 */
const kExportContext = z.never();

/**
 * Export type definitions so that the Export API can be used in `callApi()`.
 */
export type ExportsEndpoints = DataTableEndpoints<typeof kExportRowModel, typeof kExportContext>;

/**
 * Export type definition for the Export API's Row Model.
 */
export type ExportsRowModel = z.infer<typeof kExportRowModel>;

/**
 * Exports an additional access check for the given `event` and `type`.
 */
function executeActionCheckForEventAndType(
    authenticationContext: AuthenticationContext, event: Event, type: ExportType): void | never
{
    if (!hasAccessToExport(type, authenticationContext.access, authenticationContext.user))
        notFound();

    executeAccessCheck(authenticationContext, {
        check: 'admin-event',
        event: event.slug,
        permission: 'volunteer.export',
    });
}

/**
 * The Export API is implemented as a regular, editable DataTable API. All operations are only
 * available to people with the appropriate volunteering data export permission.
 */
export const { DELETE, GET, POST } = createDataTableApi(kExportRowModel, kExportContext, {
    accessCheck(request, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin',
            permission: 'volunteer.export',
        });
    },

    async create({ row }, props) {
        if (!row.type || !row.justification || !row.expirationDate || !row.expirationViews)
            return { success: false, error: 'Not all required fields were provided' };

        const event = await getEventBySlug(row.event!);
        if (!event)
            return { success: false, error: 'An invalid event was provided' };

        executeActionCheckForEventAndType(props.authenticationContext, event, row.type);

        const slug = nanoid(/* size= */ 16);
        if (!slug || slug.length !== 16)
            return { success: false, error: 'Unable to generate an export slug' };

        const expirationDate = Temporal.Instant.from(row.expirationDate).toZonedDateTimeISO('UTC');

        const dbInstance = db;
        const insertId = await dbInstance.insertInto(tExports)
            .set({
                exportSlug: slug,
                exportEventId: event.eventId,
                exportType: row.type,
                exportJustification: row.justification,
                exportCreatedDate: dbInstance.currentZonedDateTime(),
                exportCreatedUserId: props.user!.userId,
                exportExpirationDate: expirationDate,
                exportExpirationViews: row.expirationViews,
                exportEnabled: /* true= */ 1,
            })
            .returningLastInsertedId()
            .executeInsert();

        if (!insertId)
            return { success: false, error: 'xx' };

        return {
            success: true,
            row: {
                id: insertId,
                slug: slug,
                event: row.event!,
                type: row.type,
                justification: row.justification,
                createdOn: Temporal.Now.zonedDateTimeISO().toString(),
                createdBy: `${props.user!.firstName} ${props.user!.lastName}`,
                createdByUserId: props.user!.userId,
                expirationDate: expirationDate.toString(),
                expirationViews: row.expirationViews,
                views: 0,
                enabled: true,
            },
        };
    },

    async delete({ id }) {
        const affectedRows = await db.update(tExports)
            .set({
                exportEnabled: /* false= */ 0
            })
            .where(tExports.exportId.equals(id))
                .and(tExports.exportEnabled.equals(/* true= */ 1))
            .executeUpdate();

        return {
            success: !!affectedRows,
            replacementRow: {
                enabled: false,
            },
        };
    },

    async list({ pagination, sort }, props) {
        const dbInstance = db;

        const exportsLogsJoin = tExportsLogs.forUseInLeftJoin();
        const { count, data } = await dbInstance.selectFrom(tExports)
            .innerJoin(tEvents)
                .on(tEvents.eventId.equals(tExports.exportEventId))
            .innerJoin(tUsers)
                .on(tUsers.userId.equals(tExports.exportCreatedUserId))
            .leftJoin(exportsLogsJoin)
                .on(exportsLogsJoin.exportId.equals(tExports.exportId))
            .select({
                id: tExports.exportId,
                slug: tExports.exportSlug,
                event: tEvents.eventShortName,
                type: tExports.exportType,
                justification: tExports.exportJustification,
                createdOn: tExports.exportCreatedDate,
                createdBy: tUsers.name,
                createdByUserId: tUsers.userId,
                expirationDate: tExports.exportExpirationDate,
                expirationViews: tExports.exportExpirationViews,
                enabled: tExports.exportEnabled.equals(/* true= */ 1),
                views: dbInstance.count(exportsLogsJoin.accessDate),
            })
            .groupBy(tExports.exportId)
            .orderBy(sort?.field ?? 'createdOn', sort?.sort ?? 'desc')
            .limitIfValue(pagination ? pagination.pageSize : null)
                .offsetIfValue(pagination ? pagination.page * pagination.pageSize : null)
            .executeSelectPage();

        // Only make available exports of data types that the volunteer is allowed to access.
        const exportData = data.filter(row => hasAccessToExport(row.type, props.access, props.user))

        return {
            success: true,
            rowCount: count,
            rows: exportData.map(row => ({
                ...row,
                createdOn: row.createdOn.toString(),
                expirationDate: row.expirationDate.toString(),
            })),
        }
    },

    async writeLog({ id }, mutation, props) {
        const { eventName, type } = await db.selectFrom(tExports)
            .innerJoin(tEvents)
                .on(tEvents.eventId.equals(tExports.exportEventId))
            .where(tExports.exportId.equals(id))
            .select({
                eventName: tEvents.eventShortName,
                type: tExports.exportType,
            })
            .executeSelectOne();

        await Log({
            type: LogType.AdminExportMutation,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            data: { eventName, type, mutation },
        });
    },
});

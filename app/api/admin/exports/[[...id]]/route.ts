// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod/v4';

import { type DataTableEndpoints, createDataTableApi } from '../../../createDataTableApi';
import { Temporal, isBefore } from '@lib/Temporal';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tEvents, tExportsLogs, tExports, tUsers } from '@lib/database';

import { kExportType } from '@lib/database/Types';

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
    type: z.enum(kExportType),

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
 * The Export API is implemented as a regular, editable DataTable API. All operations are only
 * available to people with the appropriate volunteering data export permission.
 */
export const { GET } = createDataTableApi(kExportRowModel, kExportContext, {
    accessCheck(request, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin',
            permission: 'organisation.exports',
        });
    },

    async list({ pagination, sort }, props) {
        const dbInstance = db;

        const currentDate = Temporal.Now.zonedDateTimeISO();

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

        return {
            success: true,
            rowCount: count,
            rows: data.map(row => ({
                ...row,
                createdOn: row.createdOn.toString(),
                expirationDate: row.expirationDate.toString(),
                enabled:
                    row.enabled &&
                    row.expirationViews > row.views &&
                    isBefore(currentDate, row.expirationDate),
            })),
        }
    },
});

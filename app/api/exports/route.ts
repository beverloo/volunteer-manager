// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest } from 'next/server';
import { z } from 'zod';

import { type ActionProps, executeAction, noAccess } from '../Action';
import { ExportType } from '@lib/database/Types';
import db, { tEvents, tExports, tExportsLogs } from '@lib/database';

/**
 * Data export type definition for credit reel consent.
 */
const kCreditsDataExport = z.object({
    // todo
});

/**
 * Data export type definition for training participation.
 */
const kTrainingsDataExport = z.object({
    // todo
});

/**
 * Data export type definition for volunteer participation.
 */
const kVolunteersDataExport = z.object({
    // todo
});

/**
 * Export the aforementioned type definitions for use elsewhere in the Volunteer Manager.
 */
export type CreditsDataExport = z.infer<typeof kCreditsDataExport>;
export type TrainingsDataExport = z.infer<typeof kTrainingsDataExport>;
export type VolunteersDataExport = z.infer<typeof kVolunteersDataExport>;

/**
 * Interface definition for the Exports API, exposed through /api/exports.
 */
const kExportsDefinition = z.object({
    request: z.object({
        /**
         * Unique slug associated with the data export. These are random and non-incremental.
         */
        slug: z.string().min(1),
    }),
    response: z.object({
        /**
         * Whether the data could be accessed successfully.
         */
        success: z.boolean(),

        /**
         * Optional error message, only considered when `success` is set to `false`.
         */
        error: z.string().optional(),

        /**
         * Credit reel consent data export, when the `slug` describes that kind of export.
         */
        credits: kCreditsDataExport.optional(),

        /**
         * Training participation data export, when the `slug` desccribes that kind of export.
         */
        trainings: kTrainingsDataExport.optional(),

        /**
         * Volunteer participation data export, when the `slug` describes that kind of export.
         */
        volunteers: kVolunteersDataExport.optional(),
    }),
});

export type ExportsDefinition = z.infer<typeof kExportsDefinition>;

type Request = ExportsDefinition['request'];
type Response = ExportsDefinition['response'];

/**
 * Threshold, in milliseconds, within which reloads of the data will be ignored for logging
 * purposes. This ensures that fast subsequent access does not needlessly affect view limits.
 */
const kReloadIgnoreThreshold = 3 /* = minutes */ * 60 * 1000;

/**
 * API through which volunteers can update their training preferences.
 */
async function exports(request: Request, props: ActionProps): Promise<Response> {
    if (!props.ip)
        noAccess();

    const exportsLogsJoin = tExportsLogs.forUseInLeftJoin();

    const dbInstance = db;
    const metadata = await dbInstance.selectFrom(tExports)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tExports.exportEventId))
        .leftJoin(exportsLogsJoin)
            .on(exportsLogsJoin.exportId.equals(tExports.exportId))
        .where(tExports.exportSlug.equals(request.slug))
            .and(tExports.exportEnabled.equals(/* true= */ 1))
            .and(tExports.exportCreatedDate.lessThan(dbInstance.currentDateTime()))
        .select({
            id: tExports.exportId,
            eventId: tExports.exportEventId,
            eventName: tEvents.eventShortName,
            type: tExports.exportType,

            maximumViews: tExports.exportExpirationViews,
            views: dbInstance.count(exportsLogsJoin.exportLogId),
        })
        .groupBy(tExports.exportId)
        .having(tExports.exportExpirationViews.greaterThan(
            dbInstance.count(exportsLogsJoin.exportLogId)))
        .executeSelectNoneOrOne();

    if (!metadata)
        return { success: false, error: 'The data is no longer available, please refresh' };

    const millisecondsSinceLastLogEntry = await dbInstance.selectFrom(tExportsLogs)
        .where(tExportsLogs.exportId.equals(metadata.id))
            .and(tExportsLogs.accessIpAddress.equals(props.ip))
        .selectOneColumn(
            dbInstance.currentDateTime().getTime().substract(tExportsLogs.accessDate.getTime()))
        .orderBy(tExportsLogs.accessDate, 'desc')
        .limit(/* only the latest= */ 1)
        .executeSelectNoneOrOne();

    if (!millisecondsSinceLastLogEntry || millisecondsSinceLastLogEntry > kReloadIgnoreThreshold) {
        await dbInstance.insertInto(tExportsLogs)
            .set({
                exportId: metadata.id,
                accessDate: dbInstance.currentDateTime(),
                accessIpAddress: props.ip,
                accessUserAgent: '--todo--',
                accessUserId: props.user?.userId,
            })
            .executeInsert();

        // TODO: Log in regular logs?
    }

    let credits: CreditsDataExport | undefined = undefined;
    if (metadata.type === ExportType.Credits) {
        // todo
    }

    let trainings: TrainingsDataExport | undefined = undefined;
    if (metadata.type === ExportType.Trainings) {
        // todo
    }

    let volunteers: VolunteersDataExport | undefined = undefined;
    if (metadata.type === ExportType.Volunteers) {
        // todo
    }

    return {
        success: true,
        credits, trainings, volunteers,
    };
}

// The /api/exports route only provides a single API - call it straight away.
export const POST = (request: NextRequest) => executeAction(request, kExportsDefinition, exports);

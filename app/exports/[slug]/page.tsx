// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { ExportAvailable } from './ExportAvailable';
import { ExportLayout } from './ExportLayout';
import { ExportUnavailable } from './ExportUnavailable';
import db, { tEvents, tExports, tExportsLogs, tUsers } from '@lib/database';

/**
 * The <ExportsPage> component displays exported information, providing the given `slug` is valid
 * and that it has not expired. Data needs to be expressly accessed by the user. Exports deal with
 * a number of different states:
 *
 *   (1) The export does not exist (HTTP 404 Not Found)
 *   (2) The export exists and is available, and can be accessed.
 *   (3) The export exists and is available, and has been accessed.
 *   (4) The export exists, but is no longer available.
 *
 * Each of these will be flagged to the visitor in a clear manner. The person who shared the data
 * with them will also be identified, so that they can request a new link if necessary.
 */
export default async function ExportsPage(props: NextRouterParams<'slug'>) {
    const exportsLogsJoin = tExportsLogs.forUseInLeftJoin();

    const dbInstance = db;
    const metadata = await dbInstance.selectFrom(tExports)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tExports.exportEventId))
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tExports.exportCreatedUserId))
        .leftJoin(exportsLogsJoin)
            .on(exportsLogsJoin.exportId.equals(tExports.exportId))
        .where(tExports.exportSlug.equals(props.params.slug))
        .select({
            id: tExports.exportId,

            eventId: tExports.exportEventId,
            eventName: tEvents.eventShortName,
            type: tExports.exportType,

            userName: tUsers.firstName.concat(' ').concat(tUsers.lastName),

            enabled: tExports.exportEnabled.equals(/* true= */ 1),
            accessDateValid: tExports.exportExpirationDate.lessThan(dbInstance.currentDateTime()),
            accessViewsValid: tExports.exportExpirationViews.greaterThan(
                dbInstance.count(exportsLogsJoin.exportLogId)),
        })
        .groupBy(tExports.exportId)
        .executeSelectNoneOrOne();

    // (1) The export does not exist (HTTP 404 Not Found)
    if (!metadata)
        notFound();

    // When true:
    //   (2) The export exists and is available, and can be accessed.
    //   (3) The export exists and is available, and has been accessed.
    // When false:
    //   (4) The export exists, but is no longer available.
    const accessible = metadata.enabled && metadata.accessDateValid && metadata.accessViewsValid;

    return (
        <ExportLayout>
            { !!accessible && <ExportAvailable metadata={metadata} /> }
            { !accessible && <ExportUnavailable metadata={metadata} /> }
        </ExportLayout>
    )
}

export const metadata: Metadata = {
    title: 'Data export | AnimeCon Volunteer Manager',
};

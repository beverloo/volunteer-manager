// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import Grid from '@mui/material/Unstable_Grid2';

import type { NextPageParams } from '@lib/NextRouterParams';
import { AvailabilityToggle } from '@app/admin/components/AvailabilityToggle';
import { AvailabilityWindow } from '@app/admin/components/AvailabilityWindow';
import { FormGridSection } from '@app/admin/components/FormGridSection';
import { Privilege, can } from '@lib/auth/Privileges';
import { RefundsHeader } from './RefundsHeader';
import { RefundsTable } from './RefundsTable';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { executeServerAction } from '@lib/serverAction';
import { generateEventMetadataFn } from '../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tEvents } from '@lib/database';

import { kTemporalZonedDateTime } from '@app/api/Types';

/**
 * The data associated with a hotel configuration update.
 */
const kRefundConfigurationData = z.object({
    /**
     * Whether refund information should be published on the registration portal.
     */
    publishRefundInformation: z.coerce.number(),

    /**
     * Moment in time, if any, at which we'll start to accept refund requests.
     */
    enableRefundRequestsStart: kTemporalZonedDateTime.nullish(),

    /**
     * Moment in time, if any, at which we'll no longer accept refund requests.
     */
    enableRefundRequestsEnd: kTemporalZonedDateTime.nullish(),
});

/**
 * Server Action that will be invoked when the refund configuration is being updated by a senior
 * volunteer. Synchronises the state update request with the database.
 */
async function updateRefundConfiguration(eventId: number, formData: unknown) {
    'use server';
    return executeServerAction(formData, kRefundConfigurationData, async (data, props) => {
        await db.update(tEvents)
            .set({
                publishRefundInformation: data.publishRefundInformation,
                enableRefundRequestsStart: data.enableRefundRequestsStart,
                enableRefundRequestsEnd: data.enableRefundRequestsEnd,
            })
            .where(tEvents.eventId.equals(eventId))
            .executeUpdate();
    });
}

/**
 * The <EventRefundsPage> page allows select volunteers who are both event administrators and have
 * access to the volunteering refunds to see the overview of requested refunds for a given event.
 */
export default async function EventRefundsPage(props: NextPageParams<'slug'>) {
    const { user, event } = await verifyAccessAndFetchPageInfo(props.params);

    // Access to event settings is restricted to event administrators who also have the volunteer
    // refund permission, since this deals with particularly sensitive information.
    if (!can(user, Privilege.EventAdministrator) || !can(user, Privilege.Refunds))
        notFound();

    const enableExport = can(user, Privilege.VolunteerDataExports);

    // ---------------------------------------------------------------------------------------------

    const dbInstance = db;
    const defaultValues = await dbInstance.selectFrom(tEvents)
        .where(tEvents.eventId.equals(event.id))
        .select({
            publishRefundInformation: tEvents.publishRefundInformation,
            enableRefundRequestsStart:
                dbInstance.dateTimeAsString(tEvents.enableRefundRequestsStart),
            enableRefundRequestsEnd:
                dbInstance.dateTimeAsString(tEvents.enableRefundRequestsEnd),
        })
        .projectingOptionalValuesAsNullable()
        .executeSelectNoneOrOne() ?? undefined;

    const action = updateRefundConfiguration.bind(null, event.id);

    return (
        <>
            <RefundsHeader enableExport={enableExport} event={event} />
            <FormGridSection action={action} defaultValues={defaultValues} noHeader>
                <Grid xs={12}>
                    <SectionIntroduction>
                        This section enables you to set the timeframe for accepting refund requests,
                        and to decide if this information should be publicly available.
                    </SectionIntroduction>
                </Grid>
                <AvailabilityToggle label="Publish information" name="publishRefundInformation" />
                <AvailabilityWindow label="Accept requests" start="enableRefundRequestsStart"
                                    end="enableRefundRequestsEnd" timezone={event.timezone} />
            </FormGridSection>
            <RefundsTable event={event.slug} />
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Refunds');

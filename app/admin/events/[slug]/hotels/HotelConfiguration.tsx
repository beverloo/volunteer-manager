// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Unstable_Grid2';

import { AvailabilityToggle } from '@app/admin/components/AvailabilityToggle';
import { AvailabilityWindow } from '@app/admin/components/AvailabilityWindow';
import { FormGridSection } from '@app/admin/components/FormGridSection';
import { HotelConfigurationTable } from './HotelConfigurationTable';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { executeServerAction } from '@lib/serverAction';
import db, { tEvents } from '@lib/database';

import { kTemporalZonedDateTime } from '@app/api/Types';

/**
 * The data associated with a hotel configuration update.
 */
const kHotelConfigurationData = z.object({
    /**
     * Whether hotel information should be published on the registration portal.
     */
    publishHotelInformation: z.coerce.number(),

    /**
     * Moment in time, if any, at which we'll start to accept hotel room preferences.
     */
    enableHotelPreferencesStart: kTemporalZonedDateTime.nullish(),

    /**
     * Moment in time, if any, at which applications will no longer accept hotel room preferences.
     */
    enableHotelPreferencesEnd: kTemporalZonedDateTime.nullish(),
});

/**
 * Server Action that will be invoked when the hotel configuration is being updated by a senior
 * volunteer. Synchronises the state update request with the database.
 */
async function updateHotelConfiguration(eventId: number, formData: unknown) {
    'use server';
    return executeServerAction(formData, kHotelConfigurationData, async (data, props) => {
        await db.update(tEvents)
            .set({
                publishHotelInformation: data.publishHotelInformation,
                enableHotelPreferencesStart: data.enableHotelPreferencesStart,
                enableHotelPreferencesEnd: data.enableHotelPreferencesEnd,
            })
            .where(tEvents.eventId.equals(eventId))
            .executeUpdate();
    });
}

/**
 * Props accepted by the <HotelConfiguration> component.
 */
interface HotelConfigurationProps {
    /**
     * Information about the event for which hotel rooms are being shown.
     */
    event: {
        id: number;
        slug: string;
        timezone: string;
    };
}

/**
 * The <HotelConfiguration> component allows event administrators to add or remove hotel and hotel
 * rooms to settings. Changes will be reflected on the volunteer portal immediately.
 */
export async function HotelConfiguration(props: HotelConfigurationProps) {
    const action = updateHotelConfiguration.bind(null, props.event.id);

    const dbInstance = db;
    const configuration = await dbInstance.selectFrom(tEvents)
        .where(tEvents.eventId.equals(props.event.id))
        .select({
            publishHotelInformation: tEvents.publishHotelInformation,
            enableHotelPreferencesStart:
                dbInstance.dateTimeAsString(tEvents.enableHotelPreferencesStart),
            enableHotelPreferencesEnd:
                dbInstance.dateTimeAsString(tEvents.enableHotelPreferencesEnd),
        })
        .projectingOptionalValuesAsNullable()
        .executeSelectNoneOrOne() ?? undefined;

    return (
        <FormGridSection action={action} defaultValues={configuration}
                         timezone={props.event.timezone} title="Hotel room configuration">
            <Grid xs={12}>
                <SectionIntroduction>
                    This section allows you to specify which hotel rooms are available, and to
                    decide whether this information should be publicly accessible. Additionally, you
                    can set the time frame during which volunteers can share their room preferences.
                </SectionIntroduction>
            </Grid>
            <AvailabilityToggle label="Publish information" name="publishHotelInformation" />
            <AvailabilityWindow label="Accept preferences" start="enableHotelPreferencesStart"
                                end="enableHotelPreferencesEnd" timezone={props.event.timezone} />
            <Grid xs={12}>
                <Divider />
            </Grid>
            <Grid xs={12}>
                <HotelConfigurationTable event={props.event.slug} />
            </Grid>
        </FormGridSection>
    );
}

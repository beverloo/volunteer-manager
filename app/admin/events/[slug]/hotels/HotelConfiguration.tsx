// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Unstable_Grid2';

import { AvailabilityToggle, AvailabilityWindow } from '../settings/EventTeamSettings';
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
     * The configuration that has already been stored for hotel room settings.
     */
    configuration?: z.input<typeof kHotelConfigurationData>;

    /**
     * Information about the event for which hotel rooms are being shown.
     */
    event: {
        id: number;
        slug: string;
    };
}

/**
 * The <HotelConfiguration> component allows event administrators to add or remove hotel and hotel
 * rooms to settings. Changes will be reflected on the volunteer portal immediately.
 */
export function HotelConfiguration(props: HotelConfigurationProps) {
    const action = updateHotelConfiguration.bind(null, props.event.id);

    return (
        <FormGridSection action={action} defaultValues={props.configuration}
                         title="Hotel room configuration">
            <Grid xs={12}>
                <SectionIntroduction>
                    Configure the window during which we'll accept hotel room preferences, as well
                    as the actual hotel rooms that can be selected by volunteers.
                </SectionIntroduction>
            </Grid>
            <AvailabilityToggle label="Publish information" name="publishHotelInformation" />
            <AvailabilityWindow label="Accept preferences" start="enableHotelPreferencesStart"
                                end="enableHotelPreferencesEnd" />
            <Grid xs={12}>
                <Divider />
            </Grid>
            <Grid xs={12}>
                <HotelConfigurationTable event={props.event.slug} />
            </Grid>
        </FormGridSection>
    );
}

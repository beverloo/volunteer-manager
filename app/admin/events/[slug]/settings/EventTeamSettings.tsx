// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';


import Grid from '@mui/material/Unstable_Grid2';
import PeopleIcon from '@mui/icons-material/People';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DateTimePickerElement } from '@proxy/react-hook-form-mui';

import { EventTeamSettingsIndicator } from './EventTeamSettingsIndicator';
import { FormGridSection } from '@app/admin/components/FormGridSection';
import { executeServerAction } from '@lib/serverAction';
import db, { tEventsTeams } from '@lib/database';

import { kTemporalZonedDateTime } from '@app/api/Types';

/**
 * The data associated with team settings. Used for both input and output validation.
 */
const kTeamSettingsData = z.object({
    /**
     * Moment in time, if any, at which we'll start to accept applications.
     */
    enableApplicationsStart: kTemporalZonedDateTime.nullish(),

    /**
     * Moment in time, if any, at which applications will no longer be accepted.
     */
    enableApplicationsEnd: kTemporalZonedDateTime.nullish(),

    // TODO: Availability window for registration availability.
    // TODO: Availability window for schedule availability.
    // TODO: Availability window for sharing participation preferences.
    // TODO: Availability window for sharing availability preferences.

    // Keep on their own pages?
    //     TODO: Availability window for indicating hotel preferences.
    //     TODO: Availability window for indicating training preferences.
    //     TODO: Availability window for requesting refunds.
});

/**
 * Server Action called when the team settings are being updated. Stores the information and writes
 * an appropriate log entry to track that the mutation happened.
 */
async function updateTeamSettings(eventId: number, teamId: number, formData: unknown) {
    'use server';
    return executeServerAction(formData, kTeamSettingsData, async (data, props) => {
        await db.update(tEventsTeams)
            .set({
                enableApplicationsStart: data.enableApplicationsStart,
                enableApplicationsEnd: data.enableApplicationsEnd,
            })
            .where(tEventsTeams.eventId.equals(eventId))
                .and(tEventsTeams.teamId.equals(teamId))
                .and(tEventsTeams.enableTeam.equals(/* true= */ 1))
            .executeUpdate();

        return { success: true };
    });
}

/**
 * Props accepted by the <AvailabilityWindow> component.
 */
interface AvailabilityWindowProps {
    /**
     * Name of the field that represents the ending time of this window.
     */
    end: string;

    /**
     * Label to display in front of this availability window.
     */
    label: string;

    /**
     * Name of the field that represents the starting time of this window.
     */
    start: string;
}

/**
 * The <AvailabilityWindow> component displays two full-width date time picker components, followed
 * by an icon indicating how that would play out given the current date and time.
 */
function AvailabilityWindow(props: AvailabilityWindowProps) {
    return (
        <Grid xs={12}>
            <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="body2" sx={{ flexShrink: 0, width: '150px' }}>
                    {props.label}:
                </Typography>
                <DateTimePickerElement name={props.start}
                                       inputProps={{ fullWidth: true, size: 'small' }} />
                <Typography variant="body2">
                    until
                </Typography>
                <DateTimePickerElement name={props.end}
                                       inputProps={{ fullWidth: true, size: 'small' }} />
                <EventTeamSettingsIndicator fields={props} />
            </Stack>
        </Grid>
    );
}

/**
 * Props accepted by the <EventTeamSettings> component.
 */
export interface EventTeamSettingsProps {
    /**
     * Unique ID of the event for which the settings are being displayed.
     */
    event: number;

    /**
     * Settings that are the default values for the form, defined by the event data structure.
     */
    settings: z.input<typeof kTeamSettingsData>;

    /**
     * Name and colour of the team for whom the settings are being shown.
     */
    team: {
        id: number;
        name: string;
        colour: string;
    };

    /**
     * Timezone defining the local time where the event will be taking place.
     */
    timezone?: string;
}

/**
 * The <EventTeamSettings> component displays the dates associated with a particular event for a
 * particular team, which dictates our internal planning processes. This implicitly defines some
 * deadlines, even though we track those separately as internal and external deadlines may differ.
 */
export function EventTeamSettings(props: EventTeamSettingsProps) {
    const action = updateTeamSettings.bind(null, props.event, props.team.id);

    return (
        <FormGridSection action={action} defaultValues={props.settings}
                         timezone={props.timezone} title={props.team.name} subtitle="settings"
                         icon={ <PeopleIcon htmlColor={props.team.colour} /> }>
            { /* TODO: Availability window for registration availability. */ }
            <AvailabilityWindow label="Accept applications"
                                end="enableApplicationsEnd" start="enableApplicationsStart" />
            { /* TODO: Availability window for schedule availability. */ }
            { /* TODO: Availability window for sharing participation preferences. */ }
            { /* TODO: Availability window for sharing availability preferences. */ }
        </FormGridSection>
    );
}

// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import Grid from '@mui/material/Unstable_Grid2';
import PeopleIcon from '@mui/icons-material/People';

import { FormGridSection } from '@app/admin/components/FormGridSection';
import { executeServerAction } from '@lib/serverAction';

/**
 * The data associated with team settings. Used for both input and output validation.
 */
const kEventDatesData = z.object({
    // TODO: Availability window for registration availability.
    // TODO: Availability window for schedule availability.
    // TODO: Availability window for indicating availability.
    // TODO: Availability window for indicating hotel preferences.
    // TODO: Availability window for indicating training preferences.
    // TODO: Availability window for requesting refunds.
});

/**
 * Server Action called when the team settings are being updated. Stores the information and writes
 * an appropriate log entry to track that the mutation happened.
 */
async function updateTeamSettings(formData: unknown) {
    'use server';
    return executeServerAction(formData, kEventDatesData, async (data, props) => {

    });
}

/**
 * Props accepted by the <EventTeamSettings> component.
 */
export interface EventTeamSettingsProps {
    /**
     * Settings that are the default values for the form, defined by the event data structure.
     */
    settings: z.input<typeof kEventDatesData>;

    /**
     * Name and colour of the team for whom the settings are being shown.
     */
    team: {
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
    return (
        <FormGridSection action={updateTeamSettings} defaultValues={props.settings}
                         timezone={props.timezone} title={props.team.name} subtitle="settings"
                         icon={ <PeopleIcon htmlColor={props.team.colour} /> }>
            <Grid xs={12}>
                Settings will appear here.
            </Grid>
            { /* TODO: Availability window for registration availability. */ }
            { /* TODO: Availability window for schedule availability. */ }
            { /* TODO: Availability window for indicating availability. */ }
            { /* TODO: Availability window for indicating hotel preferences. */ }
            { /* TODO: Availability window for indicating training preferences. */ }
            { /* TODO: Availability window for requesting refunds. */ }
        </FormGridSection>
    );
}

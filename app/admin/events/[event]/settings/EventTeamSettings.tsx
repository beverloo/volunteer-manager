// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod/v4';

import PeopleIcon from '@mui/icons-material/People';

import { AvailabilityWindow } from '@app/admin/components/AvailabilityWindow';
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

    /**
     * Moment in time, if any, at which the registration portal will be published.
     */
    enableRegistrationStart: kTemporalZonedDateTime.nullish(),

    /**
     * Moment in time, if any, at which the registration portal will cease to be available.
     */
    enableRegistrationEnd: kTemporalZonedDateTime.nullish(),

    /**
     * Moment in time, if any, at which the schedule portal will be available.
     */
    enableScheduleStart: kTemporalZonedDateTime.nullish(),

    /**
     * Moment in time, if any, at which the schedule portal will be closed again.
     */
    enableScheduleEnd: kTemporalZonedDateTime.nullish(),

    // TODO: Availability window for sharing participation preferences.
    // TODO: Availability window for sharing availability preferences.
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
                enableRegistrationStart: data.enableRegistrationStart,
                enableRegistrationEnd: data.enableRegistrationEnd,
                enableScheduleStart: data.enableScheduleStart,
                enableScheduleEnd: data.enableScheduleEnd,
            })
            .where(tEventsTeams.eventId.equals(eventId))
                .and(tEventsTeams.teamId.equals(teamId))
                .and(tEventsTeams.enableTeam.equals(/* true= */ 1))
            .executeUpdate();

        return { success: true };
    });
}

/**
 * Props accepted by the <EventTeamSettings> component.
 */
interface EventTeamSettingsProps {
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
            <AvailabilityWindow label="Accept applications" timezone={props.timezone}
                                start="enableApplicationsStart" end="enableApplicationsEnd" />
            <AvailabilityWindow label="Publish information" timezone={props.timezone}
                                start="enableRegistrationStart" end="enableRegistrationEnd" />
            <AvailabilityWindow label="Publish schedules" timezone={props.timezone}
                                start="enableScheduleStart" end="enableScheduleEnd" />
            { /* TODO: Availability window for sharing participation preferences. */ }
            { /* TODO: Availability window for sharing availability preferences. */ }
        </FormGridSection>
    );
}

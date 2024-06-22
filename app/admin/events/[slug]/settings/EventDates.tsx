// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { FormGridSection } from '@app/admin/components/FormGridSection';
import { executeServerAction } from '@lib/serverAction';

import { kTemporalZonedDateTime } from '@app/api/Types';

/**
 * The data associated with event dates. Used for both input and output validation.
 */
const kEventDatesData = z.object({
    /**
     * Times and dates defining the window during which the event's existence will be advertised.
     */
    publishRegistrationStart: kTemporalZonedDateTime,
    publishRegistrationEnd: kTemporalZonedDateTime,

    /**
     * Times and dates defining the window during which the event's schedules will be advertised.
     */
    publishScheduleStart: kTemporalZonedDateTime,
    publishScheduleEnd: kTemporalZonedDateTime,

    // TODO: Availability window for indicating availability.
    // TODO: Availability window for indicating hotel preferences.
    // TODO: Availability window for indicating training preferences.
    // TODO: Availability window for requesting refunds.
});

/**
 * Server Action called when the event dates are being updated. Stores the information and writes an
 * appropriate log entry to track that the mutation happened.
 */
async function updateEventDates(formData: unknown) {
    'use server';
    return executeServerAction(formData, kEventDatesData, async (data, props) => {

    });
}

/**
 * Props accepted by the <EventDates> component.
 */
export interface EventDatesProps {
    /**
     * Default values for the form, defined by the event data structure.
     */
    defaultValues?: z.input<typeof kEventDatesData>;

    /**
     * Timezone defining the local time where the event will be taking place.
     */
    timezone?: string;
}

/**
 * The <EventDates> component displays the dates associated with a particular event, which dictates
 * our internal planning processes. This implicitly defines some deadlines, even though we track
 * those separately as internal and external deadlines may be different.
 */
export function EventDates(props: EventDatesProps) {
    if (!props.defaultValues || !props.timezone)
        return undefined;  // TODO: Support this component

    return (
        <FormGridSection action={updateEventDates} defaultValues={props.defaultValues}
                         timezone={props.timezone} title="Dates" subtitle="Event Planning">
            Yo
        </FormGridSection>
    );
}

// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Event } from '@lib/Event';
import { Temporal } from '@lib/Temporal';
import { getTimeslots } from './getTimeslots';
import { readSettings } from '@lib/Settings';
import { determineAvailability } from './determineAvailability';

/**
 * Type that defines the information we need to know about a particular shift.
 */
type ShiftInfo = { start: Temporal.ZonedDateTime; end: Temporal.ZonedDateTime; };

/**
 * Type that defines the information we need to know about a particular volunteer.
 */
type VolunteerInfo = {
    availabilityExceptions?: string;
    availabilityTimeslots?: string;
    preferenceTimingStart?: number;
    preferenceTimingEnd?: number;
};

/**
 * Determines whether the given `shift` is valid to schedule for the given `user`. This considers
 * both their existing shfits and their (un)availability, in relation to the current event.
 */
export async function isValidShift(event: Event, volunteer: VolunteerInfo, shift: ShiftInfo)
    : Promise<boolean>
{
    const timeslots = await getTimeslots(event.festivalId);
    const settings = await readSettings([
        'schedule-day-view-start-time',
        'schedule-event-view-start-hours',
        'schedule-event-view-end-hours',
    ]);

    const availability = determineAvailability({
        event: {
            startTime: event.temporalStartTime,
            endTime: event.temporalEndTime,
            timezone: event.timezone,
        },
        settings,
        timeslots,
        volunteer: {
            availabilityExceptions: volunteer.availabilityExceptions,
            availabilityTimeslots: volunteer.availabilityTimeslots,
            // deliberately do not carry over the timing preferences, as that would block shifts
            // from being assigned there -- they are preferences, not rules
        },
    });

    for (const block of availability.unavailable) {
        if (Temporal.ZonedDateTime.compare(shift.end, block.start) <= 0)
            continue;  // the |shift| finishes before the |block|
        if (Temporal.ZonedDateTime.compare(shift.start, block.end) >= 0)
            continue;  // the |shift| starts after the |block|

        return false;
    }

    return true;
}

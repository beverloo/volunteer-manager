// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { default as MuiLink } from '@mui/material/Link';
import Box from '@mui/material/Box';

import type { NextPageParams } from '@lib/NextRouterParams';
import { AvailabilityExpectations, type AvailabilityDayInfo, type AvailabilityExpectation } from './AvailabilityExpectations';
import { AvailabilityPreferences } from './AvailabilityPreferences';
import { Markdown } from '@components/Markdown';
import { Temporal, formatDate, isBefore, isAfter } from '@lib/Temporal';
import { contextForRegistrationPage } from '../../contextForRegistrationPage';
import { generatePortalMetadataFn } from '../../../generatePortalMetadataFn';
import { getPublicEventsForFestival, type EventTimeslotEntry } from './getPublicEventsForFestival';
import { getStaticContent } from '@lib/Content';
import { EventAvailabilityStatus } from '@lib/database/Types';
import db, { tUsersEvents } from '@lib/database';

/**
 * Returns whether `one` and `two` fall on the same day.
 */
function isSameDay(one: Temporal.ZonedDateTime, two: Temporal.ZonedDateTime) {
    return one.year === two.year &&
           one.month === two.month &&
           one.day === two.day;
}

/**
 * The <EventApplicationAvailabilityPage> component enables our volunteers to indicate when they
 * will be around at the festival, and which events they really want to attend.
 */
export default async function EventApplicationAvailabilityPage(props: NextPageParams<'slug'>) {
    const context = await contextForRegistrationPage(props.params.slug);
    if (!context || !context.registration || !context.user)
        notFound();  // the event does not exist, or the volunteer is not signed in

    const { access, environment, event, registration, user } = context;

    const enabled = [
        EventAvailabilityStatus.Available,
        EventAvailabilityStatus.Locked
    ].includes(registration.availabilityStatus);

    const enabledWithOverride =
        enabled ||
        access.can('event.visible', {
            event: event.slug,
            team: environment.teamSlug
        });

    const preferences = null;

    if (!enabledWithOverride && !preferences)
        notFound();  // the volunteer is not eligible to indicate their preferences

    const content = await getStaticContent([ 'registration', 'application', 'availability' ], {
        firstName: user.firstName,
    });

    // ---------------------------------------------------------------------------------------------
    // Section: Event preferences
    // ---------------------------------------------------------------------------------------------
    // Note that populating `selectedEvents` is O(kn) in time complexity, but since we know that
    // `k` (the number of selected events) will almost always be in the single digits let's have it.

    let events: EventTimeslotEntry[] = [];

    const selectedEvents: EventTimeslotEntry[] = [];
    if (registration.availabilityEventLimit > 0 && !!event.festivalId) {
        events = await getPublicEventsForFestival(
            event.festivalId, event.timezone, /* withTimingInfo= */ true);

        for (const timeslotId of registration.availability.timeslots) {
            for (const eventTimeslot of events) {
                if (eventTimeslot.id !== timeslotId)
                    continue;

                selectedEvents.push(eventTimeslot);
            }
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Availability exceptions
    // ---------------------------------------------------------------------------------------------

    const exceptionInfo = await db.selectFrom(tUsersEvents)
        .where(tUsersEvents.userId.equals(user.userId))
            .and(tUsersEvents.eventId.equals(event.eventId))
            .and(tUsersEvents.teamId.equals(registration.teamId))
        .selectOneColumn(tUsersEvents.availabilityExceptions)
        .executeSelectNoneOrOne();

    const exceptions = new Map</* YYYY-MM-DDTH */ string, AvailabilityExpectation>;
    if (exceptionInfo && exceptionInfo.length > 2) {
        try {
            const exceptionArray = JSON.parse(exceptionInfo);
            for (const exception of exceptionArray) {
                if (!('start' in exception) || !('end' in exception) || !('state' in exception))
                    continue;

                const end = Temporal.ZonedDateTime.from(exception.end).withTimeZone(event.timezone);
                const start =
                    Temporal.ZonedDateTime.from(exception.start).withTimeZone(event.timezone).with({
                        minute: 0,
                    });

                for (let time = start; isBefore(time, end); time = time.add({ hours: 1 }))
                    exceptions.set(formatDate(time, 'YYYY-MM-DD[T]H'), exception.state);
            }

        } catch (error: any) {
            console.error('Unable to parse exception information:', error);
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Availability
    // ---------------------------------------------------------------------------------------------

    const startDateTime = event.temporalStartTime.withTimeZone(event.timezone);
    const startDate = startDateTime.with({
        hour: 0,
        minute: 0,
        second: 0
    });

    const endDateTime = event.temporalEndTime.withTimeZone(event.timezone);
    const endDate = endDateTime.with({
        hour: 23,
        minute: 59,
        second: 59,
    });

    let serviceTimingStart: number | undefined;
    let serviceTimingEnd: number | undefined;

    if (!!registration.availability.serviceTiming) {
        [ serviceTimingStart, serviceTimingEnd ] =
            registration.availability.serviceTiming.split('-').map(v => parseInt(v, 10));
    }

    const expectations: AvailabilityDayInfo[] = [];
    for (let date = startDate; isBefore(date, endDate); date = date.add({ days: 1 })) {
        const dateString = formatDate(date, 'YYYY-MM-DD');

        expectations.push({
            label: formatDate(date, 'dddd, MMMM D'),
            expectations: [ ...Array(/* hours= */ 24) ].map((_, hour) => {
                const hourlyDateTime = date.add({ hours: hour });
                let decidedStatus: AvailabilityExpectation = 'available';

                // Consider exceptions that have been approved by the volunteering leads. When one
                // is seen, all other processing will be moot.
                const exception = exceptions.get(`${dateString}T${hour}`);
                if (!!exception)
                    return exception;

                // Consider the window in which the volunteer indicated they want to help out with
                // shifts. We'll add some grace, but otherwise will roster them out at other times.
                if (serviceTimingStart !== undefined && serviceTimingEnd !== undefined) {
                    if (serviceTimingEnd > serviceTimingStart) {
                        // Case (1): The volunteer's shifts will start and end on the same day.
                        const hoursUntilWindowStart = serviceTimingStart - hour;
                        const hoursUntilWindowEnd = serviceTimingEnd - hour;

                        if (hoursUntilWindowStart > 1)
                            decidedStatus = 'unavailable';
                        else if (hoursUntilWindowStart > 0)
                            decidedStatus = 'avoid';

                        if (hoursUntilWindowEnd === 0)
                            decidedStatus = 'avoid';
                        else if (hoursUntilWindowEnd < 0)
                            decidedStatus = 'unavailable';

                    } else {
                        // Case (2): The volunteer's shifts will start and end on separate days.
                        const hoursUntilWindowStart = serviceTimingStart - hour;

                        if (!isSameDay(date, startDate)) {
                            if (hour === serviceTimingEnd)
                                decidedStatus = 'avoid';
                            else if (hour > serviceTimingEnd && hoursUntilWindowStart > 2)
                                decidedStatus = 'unavailable';
                        }

                        if (hour > serviceTimingEnd) {
                            if (hoursUntilWindowStart > 1)
                                decidedStatus = 'unavailable';
                            else if (hoursUntilWindowStart > 0)
                                decidedStatus = 'avoid';
                        }
                    }
                }

                // Consider the events that the volunteer has selected as wanting to attend. We only
                // reduce the availability here, in other words "available" becomes "avoid", but
                // "unavailable" remains "unavailable".
                if (decidedStatus !== 'unavailable' && selectedEvents.length > 0) {
                    const nextHourlyDateTime = hourlyDateTime.add({ hours: 1 });
                    for (const eventTimeslot of selectedEvents) {
                        if (!eventTimeslot.startTime || !eventTimeslot.endTime)
                            continue;  // incomplete timeslot

                        if (isBefore(eventTimeslot.startTime, nextHourlyDateTime) &&
                                isAfter(eventTimeslot.endTime, hourlyDateTime)) {
                            decidedStatus = 'avoid';
                        }
                    }
                }

                // We won't schedule shifts (well) before the festival's opening time without having
                // discussed this with the volunteer.
                if (isSameDay(date, startDate)) {
                    const hoursUntilOpening = hourlyDateTime.until(startDateTime, {
                        largestUnit: 'hours'
                    }).hours;

                    if (hoursUntilOpening > 3)
                        return 'unavailable';
                    else if (hoursUntilOpening > 1)
                        return 'avoid';  // always invite volunteers to the briefing
                }

                // Similarly, we won't schedule shifts after the festival has finished. Folks are
                // welcome to stick around, but we won't count on it.
                if (isSameDay(date, endDate)) {
                    const hoursUntilClosure = hourlyDateTime.until(endDateTime, {
                        largestUnit: 'hours'
                    }).hours;

                    if (hoursUntilClosure <= 0)
                        return 'unavailable';
                }

                // If all else fails, the volunteer will be available.
                return decidedStatus;
            }),
        });
    }

    // ---------------------------------------------------------------------------------------------

    const readOnly = registration.availabilityStatus === EventAvailabilityStatus.Locked;
    const strippedEventInformation = events.map(event => ({
        id: event.id,
        label: event.label,
    }));

    return (
        <Box sx={{ p: 2 }}>
            { content && <Markdown>{content.markdown}</Markdown> }

            { expectations.length > 0 &&
                <AvailabilityExpectations expectations={expectations} /> }

            <AvailabilityPreferences event={event.slug} team={environment.environmentTeamDoNotUse}
                                     events={strippedEventInformation}
                                     limit={registration.availabilityEventLimit}
                                     preferences={registration.availability} readOnly={readOnly} />

            <MuiLink component={Link} href={`/registration/${event.slug}/application`}>
                « Back to your registration
            </MuiLink>
        </Box>
    );
}

export const generateMetadata = generatePortalMetadataFn('Availability preferences');

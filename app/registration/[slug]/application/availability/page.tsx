// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { default as MuiLink } from '@mui/material/Link';
import Box from '@mui/material/Box';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { AvailabilityExpectations, type AvailabilityDayInfo, type AvailabilityExpectation } from './AvailabilityExpectations';
import { AvailabilityPreferences } from './AvailabilityPreferences';
import { Markdown } from '@components/Markdown';
import { Privilege, can } from '@lib/auth/Privileges';
import { contextForRegistrationPage } from '../../contextForRegistrationPage';
import { dayjs } from '@lib/DateTime';
import { generatePortalMetadataFn } from '../../../generatePortalMetadataFn';
import { getPublicEventsForFestival, type EventTimeslotEntry } from './getPublicEventsForFestival';
import { getStaticContent } from '@lib/Content';

/**
 * The <EventApplicationAvailabilityPage> component enables our volunteers to indicate when they
 * will be around at the festival, and which events they really want to attend.
 */
export default async function EventApplicationAvailabilityPage(props: NextRouterParams<'slug'>) {
    const context = await contextForRegistrationPage(props.params.slug);
    if (!context || !context.registration || !context.user)
        notFound();  // the event does not exist, or the volunteer is not signed in

    const { environment, event, registration, user } = context;

    const enabled = registration.availabilityAvailable || can(user, Privilege.EventAdministrator);
    const preferences = null;

    if (!enabled && !preferences)
        notFound();  // the volunteer is not eligible to indicate their preferences

    const content = await getStaticContent([ 'registration', 'application', 'availability' ], {
        firstName: user.firstName,
    });

    // ---------------------------------------------------------------------------------------------
    // Section: Availability
    // ---------------------------------------------------------------------------------------------

    const startDateTime = dayjs(event.startTime);
    const startDate = startDateTime.startOf('day');

    const endDateTime = dayjs(event.endTime);
    const endDate = endDateTime.endOf('day');

    let serviceTimingStart: number | undefined;
    let serviceTimingEnd: number | undefined;

    if (!!registration.availability.serviceTiming) {
        [ serviceTimingStart, serviceTimingEnd ] =
            registration.availability.serviceTiming.split('-').map(v => parseInt(v, 10));
    }

    const expectations: AvailabilityDayInfo[] = [];
    for (let date = startDate; date.isBefore(endDate); date = date.add(1, 'day')) {
        expectations.push({
            label: date.format('dddd, MMMM D'),
            expectations: [ ...Array(/* hours= */ 24) ].map((_, hour) => {
                const hourlyDateTime = dayjs(date).add(hour, 'hours');
                let decidedStatus: AvailabilityExpectation = 'available';

                // TODO: Consider exceptions "approved" by volunteering leads
                // TODO: Consider the events the volunteer would like to attend

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

                        if (!date.isSame(startDate, 'day')) {
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

                // We won't schedule shifts (well) before the festival's opening time without having
                // discussed this with the volunteer.
                if (date.isSame(startDate, 'day')) {
                    const hoursUntilOpening = startDateTime.diff(hourlyDateTime, 'hours');
                    if (hoursUntilOpening > 3)
                        return 'unavailable';
                    else if (hoursUntilOpening > 1)
                        return 'avoid';  // always invite volunteers to the briefing
                }

                // Similarly, we won't schedule shifts after the festival has finished. Folks are
                // welcome to stick around, but we won't count on it.
                if (date.isSame(endDate, 'day')) {
                    const hoursUntilClosure = endDateTime.diff(hourlyDateTime, 'hours');
                    if (hoursUntilClosure <= 0)
                        return 'unavailable';
                }

                // If all else fails, the volunteer will be available.
                return decidedStatus;
            }),
        });
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Event preferences
    // ---------------------------------------------------------------------------------------------

    let events: EventTimeslotEntry[] = [];
    if (registration.availabilityEventLimit > 0 && !!event.festivalId)
        events = await getPublicEventsForFestival(event.festivalId);

    // ---------------------------------------------------------------------------------------------

    // TODO: Figure out when to pass `readOnly` to <AvailabilityPreferences>.

    return (
        <Box sx={{ p: 2 }}>
            { content && <Markdown>{content.markdown}</Markdown> }

            { expectations.length > 0 &&
                <AvailabilityExpectations expectations={expectations} /> }

            <AvailabilityPreferences environment={environment.environmentName}
                                     eventSlug={event.slug} events={events}
                                     limit={registration.availabilityEventLimit}
                                     preferences={registration.availability} />

            <MuiLink component={Link} href={`/registration/${event.slug}/application`}>
                « Back to your registration
            </MuiLink>
        </Box>
    );
}

export const generateMetadata = generatePortalMetadataFn('Availability preferences');

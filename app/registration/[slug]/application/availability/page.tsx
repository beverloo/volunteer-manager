// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { default as MuiLink } from '@mui/material/Link';
import Box from '@mui/material/Box';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { AvailabilityExpectations, type AvailabilityDayInfo } from './AvailabilityExpectations';
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

    const startDate = dayjs(event.startTime).startOf('day');
    const endDate = dayjs(event.endTime).endOf('day');

    const expectations: AvailabilityDayInfo[] = [];
    for (let date = startDate; date.isBefore(endDate); date = date.add(1, 'day')) {
        // TODO: Consider their preferred timing.
        // TODO: Consider the events they would like to attend.

        expectations.push({
            label: date.format('dddd, MMMM D'),
            expectations: [ ...Array(/* hours= */ 24) ].map(v => 'unavailable'),
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

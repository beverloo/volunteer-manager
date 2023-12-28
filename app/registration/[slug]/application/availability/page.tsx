// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { default as MuiLink } from '@mui/material/Link';
import Box from '@mui/material/Box';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { ActivityType } from '@lib/database/Types';
import { AvailabilityPreferences, type EventEntry } from './AvailabilityPreferences';
import { Markdown } from '@components/Markdown';
import { Privilege, can } from '@lib/auth/Privileges';
import { contextForRegistrationPage } from '../../contextForRegistrationPage';
import { dayjs } from '@lib/DateTime';
import { generatePortalMetadataFn } from '../../../generatePortalMetadataFn';
import { getStaticContent } from '@lib/Content';
import { readSetting } from '@lib/Settings';
import db, { tActivities, tActivitiesTimeslots } from '@lib/database';

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
    // Section: Event preferences
    // ---------------------------------------------------------------------------------------------

    const events: EventEntry[] = [];

    if (registration.availabilityEventLimit > 0 && !!event.festivalId) {
        const maxDurationMinutes =
            await readSetting('availability-max-event-duration-minutes') ?? Number.MAX_SAFE_INTEGER;

        const timeslots = await db.selectFrom(tActivities)
            .innerJoin(tActivitiesTimeslots)
                .on(tActivitiesTimeslots.activityId.equals(tActivities.activityId))
                .and(tActivitiesTimeslots.timeslotDeleted.isNull())
            .where(tActivities.activityFestivalId.equals(event.festivalId))
                .and(tActivities.activityType.equals(ActivityType.Program))
                .and(tActivities.activityVisible.equals(/* true= */ 1))
                .and(tActivities.activityDeleted.isNull())
            .select({
                id: tActivitiesTimeslots.timeslotId,
                title: tActivities.activityTitle,
                startTime: tActivitiesTimeslots.timeslotStartTime,
                endTime: tActivitiesTimeslots.timeslotEndTime,
            })
            .orderBy(tActivities.activityTitle, 'asc')
            .orderBy(tActivitiesTimeslots.timeslotStartTime, 'asc')
            .executeSelectMany();

        for (const timeslot of timeslots) {
            const startTime = dayjs(timeslot.startTime);
            const endTime = dayjs(timeslot.endTime);

            const duration = endTime.diff(startTime, 'minutes');
            if (duration < 0 || duration > maxDurationMinutes)
                continue;  // this event exceeds the duration cutoff

            events.push({
                id: timeslot.id,
                label: `${timeslot.title} (${dayjs(startTime).format('dddd, HH:mm')}–` +
                    `${dayjs(endTime).format('HH:mm')})`,
            });
        }
    }

    // ---------------------------------------------------------------------------------------------

    return (
        <Box sx={{ p: 2 }}>
            { content && <Markdown>{content.markdown}</Markdown> }

            { /* TODO: Availability overview */ }

            <AvailabilityPreferences environment={environment.environmentName}
                                     eventSlug={event.slug} events={events}
                                     limit={registration.availabilityEventLimit}
                                     selection={registration.availability.timeslots} />

            <MuiLink component={Link} href={`/registration/${event.slug}/application`}>
                « Back to your registration
            </MuiLink>
        </Box>
    );
}

export const generateMetadata = generatePortalMetadataFn('Availability preferences');

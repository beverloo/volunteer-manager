// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { Privilege, can } from '@lib/auth/Privileges';
import { generateEventMetadataFn } from '../../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tUsers, tUsersEvents } from '@lib/database';

import { ApplicationHotelInfo } from './ApplicationHotelInfo';
import { ApplicationMetadata } from './ApplicationMetadata';
import { ApplicationPreferences } from './ApplicationPreferences';
import { ApplicationTrainingInfo } from './ApplicationTrainingInfo';
import { RegistrationStatus } from '@lib/database/Types';
import { VolunteerAvailability } from './VolunteerAvailability';
import { VolunteerContactInfo } from './VolunteerContactInfo';
import { VolunteerHeader } from './VolunteerHeader';

type RouterParams = NextRouterParams<'slug' | 'team' | 'volunteer'>;

/**
 * Displays information about an individual volunteer and their participation in a particular event.
 * Different from the general volunteer account information page, which can only be accessed by a
 * more limited number of people.
 */
export default async function EventVolunteerPage(props: RouterParams) {
    const { user, event, team } = await verifyAccessAndFetchPageInfo(props.params);

    const volunteer = await db.selectFrom(tUsersEvents)
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .where(tUsersEvents.userId.equals(parseInt(props.params.volunteer, 10)))
            .and(tUsersEvents.eventId.equals(event.id))
            .and(tUsersEvents.teamId.equals(team.id))
            .and(tUsersEvents.registrationStatus.in(
                [ RegistrationStatus.Accepted, RegistrationStatus.Cancelled ]))
        .select({
            userId: tUsersEvents.userId,
            username: tUsers.username,
            firstName: tUsers.firstName,
            lastName: tUsers.lastName,
            phoneNumber: tUsers.phoneNumber,
            roleId: tUsersEvents.roleId,
            registrationDate: tUsersEvents.registrationDate,
            registrationStatus: tUsersEvents.registrationStatus,
            hotelEligible: tUsersEvents.hotelEligible,
            trainingEligible: tUsersEvents.trainingEligible,
            credits: tUsersEvents.includeCredits,
            preferences: tUsersEvents.preferences,
            serviceHours: tUsersEvents.preferenceHours,
            preferenceTimingStart: tUsersEvents.preferenceTimingStart,
            preferenceTimingEnd: tUsersEvents.preferenceTimingEnd,
            socials: tUsersEvents.includeSocials,
            tshirtFit: tUsersEvents.shirtFit,
            tshirtSize: tUsersEvents.shirtSize,
        })
        .executeSelectNoneOrOne();

    if (!volunteer)
        notFound();

    const contactAccess =
        can(user, Privilege.EventVolunteerContactInfo) ||
        can(user, Privilege.VolunteerAdministrator);

    const contactInfo =
        contactAccess ? { username: volunteer.username, phoneNumber: volunteer.phoneNumber }
                      : undefined;

    return (
        <>
            <VolunteerHeader event={event} team={team} volunteer={volunteer}
                             user={user.toUserData()} />
            <ApplicationPreferences event={event} team={team} volunteer={volunteer} />
            <VolunteerContactInfo eventId={event.id} teamId={team.id} userId={volunteer.userId}
                                  contactInfo={contactInfo} />
            { can(user, Privilege.EventVolunteerApplicationOverrides) &&
                <ApplicationMetadata eventId={event.id} teamId={team.id} volunteer={volunteer} /> }
            <VolunteerAvailability />
            { can(user, Privilege.EventAdministrator) &&
                <ApplicationHotelInfo /> }
            { can(user, Privilege.EventAdministrator) &&
                <ApplicationTrainingInfo /> }
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Volunteer');

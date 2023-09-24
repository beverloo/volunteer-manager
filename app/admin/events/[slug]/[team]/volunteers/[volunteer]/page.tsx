// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { Privilege, can } from '@lib/auth/Privileges';
import { generateEventMetadataFn } from '../../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tHotelsPreferences, tRoles, tStorage, tTrainingsAssignments, tUsers, tUsersEvents }
    from '@lib/database';

import { ApplicationHotelPreferences } from './ApplicationHotelPreferences';
import { ApplicationMetadata } from './ApplicationMetadata';
import { ApplicationPreferences } from './ApplicationPreferences';
import { ApplicationTrainingPreferences } from './ApplicationTrainingPreferences';
import { RegistrationStatus } from '@lib/database/Types';
import { VolunteerHeader } from './VolunteerHeader';
import { VolunteerIdentity } from './VolunteerIdentity';
import { getHotelRoomOptions } from '@app/registration/[slug]/application/hotel/page';
import { getTrainingOptions } from '@app/registration/[slug]/application/training/page';

type RouterParams = NextRouterParams<'slug' | 'team' | 'volunteer'>;

/**
 * Displays information about an individual volunteer and their participation in a particular event.
 * Different from the general volunteer account information page, which can only be accessed by a
 * more limited number of people.
 */
export default async function EventVolunteerPage(props: RouterParams) {
    const { user, event, team } = await verifyAccessAndFetchPageInfo(props.params);

    const storageJoin = tStorage.forUseInLeftJoin();

    const volunteer = await db.selectFrom(tUsersEvents)
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .leftJoin(storageJoin)
            .on(storageJoin.fileId.equals(tUsers.avatarId))
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
            avatarFileHash: storageJoin.fileHash,
            phoneNumber: tUsers.phoneNumber,
            roleId: tUsersEvents.roleId,
            roleName: tRoles.roleName,
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

            isHotelEligible: tUsersEvents.hotelEligible.valueWhenNull(tRoles.roleHotelEligible),
            isTrainingEligible:
                tUsersEvents.trainingEligible.valueWhenNull(tRoles.roleTrainingEligible),
        })
        .executeSelectNoneOrOne();

    if (!volunteer)
        notFound();

    let hotelManagement: React.ReactNode = undefined;
    if (can(user, Privilege.EventHotelManagement) && !!volunteer.isHotelEligible) {
        const hotelOptions = await getHotelRoomOptions(event.id);
        const hotelPreferences = await db.selectFrom(tHotelsPreferences)
            .where(tHotelsPreferences.userId.equals(volunteer.userId))
                .and(tHotelsPreferences.eventId.equals(event.id))
                .and(tHotelsPreferences.teamId.equals(team.id))
            .select({
                hotelId: tHotelsPreferences.hotelId,
                sharingPeople: tHotelsPreferences.hotelSharingPeople,
                sharingPreferences: tHotelsPreferences.hotelSharingPreferences,
                checkIn: tHotelsPreferences.hotelDateCheckIn,
                checkOut: tHotelsPreferences.hotelDateCheckOut,
            })
            .executeSelectNoneOrOne() ?? undefined;

        hotelManagement = (
            <ApplicationHotelPreferences eventDate={event.startTime.toDateString()}
                                         eventSlug={event.slug} hotelOptions={hotelOptions}
                                         hotelPreferences={hotelPreferences}
                                         teamSlug={team.slug} volunteerUserId={volunteer.userId} />
        );
    }

    let trainingManagement: React.ReactNode = undefined;
    if (can(user, Privilege.EventTrainingManagement) && !!volunteer.isTrainingEligible) {
        const trainingOptions = await getTrainingOptions(event.id);
        const training = await db.selectFrom(tTrainingsAssignments)
            .where(tTrainingsAssignments.eventId.equals(event.id))
                .and(tTrainingsAssignments.assignmentUserId.equals(volunteer.userId))
            .select({
                preference: tTrainingsAssignments.preferenceTrainingId,
            })
            .executeSelectNoneOrOne() ?? undefined;

        trainingManagement = (
            <ApplicationTrainingPreferences eventSlug={event.slug}
                                            teamSlug={team.slug}
                                            trainingOptions={trainingOptions} training={training}
                                            volunteerUserId={volunteer.userId} />
        );
    }

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
            <VolunteerIdentity eventId={event.id} teamId={team.id} userId={volunteer.userId}
                               contactInfo={contactInfo} volunteer={volunteer} />
            <ApplicationPreferences event={event.slug} team={team.slug} volunteer={volunteer} />
            {hotelManagement}
            {trainingManagement}
            { can(user, Privilege.EventVolunteerApplicationOverrides) &&
                <ApplicationMetadata event={event.slug} team={team.slug} volunteer={volunteer} /> }
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Volunteer');

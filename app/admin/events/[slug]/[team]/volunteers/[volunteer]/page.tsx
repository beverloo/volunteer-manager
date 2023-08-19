// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import { NextRouterParams } from '@lib/NextRouterParams';
import { Privilege, can } from '@lib/auth/Privileges';
import { generateEventMetadataFn } from '../../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import db, { tUsers, tUsersEvents } from '@lib/database';

import { Availability } from './Availability';
import { Header } from './Header';
import { HotelInformation } from './HotelInformation';
import { Information } from './Information';
import { RegistrationStatus } from '@lib/database/Types';
import { TrainingInformation } from './TrainingInformation';

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
            firstName: tUsers.firstName,
            lastName: tUsers.lastName,
            registrationStatus: tUsersEvents.registrationStatus,
        })
        .executeSelectNoneOrOne();

    if (!volunteer)
        notFound();

    return (
        <>
            <Header event={event} team={team} volunteer={volunteer} user={user.toUserData()} />
            <Information />
            <Availability />
            { can(user, Privilege.EventAdministrator) &&
                <HotelInformation /> }
            { can(user, Privilege.EventAdministrator) &&
                <TrainingInformation /> }
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Volunteer');

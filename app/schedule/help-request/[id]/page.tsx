// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound, redirect } from 'next/navigation';

import type { NextPageParams } from '@lib/NextRouterParams';
import { RegistrationStatus } from '@lib/database/Types';
import { getAuthenticationContext } from '@lib/auth/AuthenticationContext';
import { readSetting } from '@lib/Settings';
import db, { tEvents, tTeams, tUsersEvents } from '@lib/database';

/**
 * The <EventlessHelpRequestPageWithId> component redirects the user to the latest available
 * schedule tool for a particular help request. This link is included in WhatsApp messages.
 */
export default async function EventlessHelpRequestPageWithId(props: NextPageParams<'id'>) {
    const helpRequestEventSlug = await readSetting('schedule-help-request-event-slug');
    if (!helpRequestEventSlug)
        notFound();

    const { user } = await getAuthenticationContext();
    if (!user)
        redirect('/');

    const { id } = props.params;

    const environment = await db.selectFrom(tEvents)
        .innerJoin(tUsersEvents)
            .on(tUsersEvents.eventId.equals(tEvents.eventId))
                .and(tUsersEvents.userId.equals(user.userId))
                .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Accepted))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tUsersEvents.teamId))
        .where(tEvents.eventSlug.equals(helpRequestEventSlug))
        .selectOneColumn(tTeams.teamEnvironment)
        .executeSelectNoneOrOne();

    if (!!environment)
        redirect(`https://${environment}/schedule/${helpRequestEventSlug}/help-requests/${id}`);
    else
        redirect(`/schedule/${helpRequestEventSlug}/help-requests/${id}`);
}

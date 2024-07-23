// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { NextPageParams } from '@lib/NextRouterParams';
import { type Content, getContent, getStaticContent } from '@lib/Content';
import { ApplicationPage, type PartneringTeamApplication } from './ApplicationPage';
import { ApplicationStatusPage, type ApplicationStatusPageProps } from './ApplicationStatusPage';
import { Markdown } from '@components/Markdown';
import { Privilege, can } from '@lib/auth/Privileges';
import { RegistrationStatus } from '@lib/database/Types';
import { contextForRegistrationPage } from '../contextForRegistrationPage';
import { generatePortalMetadataFn } from '../../generatePortalMetadataFn';
import db, { tEvents, tTeams, tUsersEvents } from '@lib/database';

/**
 * The <EventApplicationPage> component serves the ability for volunteers to either apply to join
 * one of our events, or for them to see the status of their current application.
 */
export default async function EventApplicationPage(props: NextPageParams<'slug'>) {
    const context = await contextForRegistrationPage(props.params.slug);
    if (!context)
        notFound();

    const { access, environment, event, registration, user } = context;

    const accessScope = { event: event.slug, team: environment.teamSlug };

    let content: Content | undefined = undefined;
    let state: 'status' | 'application' | 'unavailable';

    if (registration && user) {
        state = 'status';
    } else {
        const environmentData = event.getEnvironmentData(environment.environmentName);
        if (environmentData?.enableApplications ||
                access.can('event.applications', 'create', accessScope)) {
            content = await getContent(environment.environmentName, event, [ 'application' ]);
            state = 'application';
        } else {
            content = await getStaticContent([ 'registration', 'application', 'unavailable' ]);
            state = 'unavailable';
        }
    }

    let partnerApplications: PartneringTeamApplication[] = [];
    if (state === 'application' && user) {
        partnerApplications = await db.selectFrom(tUsersEvents)
            .innerJoin(tTeams)
                .on(tTeams.teamId.equals(tUsersEvents.teamId))
            .where(tUsersEvents.userId.equals(user.userId))
                .and(tUsersEvents.eventId.equals(event.eventId))
                .and(tUsersEvents.registrationStatus.in(
                    [ RegistrationStatus.Registered, RegistrationStatus.Accepted ]))
            .select({
                environment: tTeams.teamEnvironment,
                name: tTeams.teamName,
                status: tUsersEvents.registrationStatus,
            })
            .orderBy(tTeams.teamName, 'asc')
            .executeSelectMany();
    }

    let availabilityWindows: ApplicationStatusPageProps['availabilityWindows'] = { /* default */ };
    if (state === 'status' && user) {
        const dbInstance = db;

        availabilityWindows = await dbInstance.selectFrom(tEvents)
            .where(tEvents.eventId.equals(event.id))
            .select({
                hotelPreferences: {
                    start: dbInstance.dateTimeAsString(tEvents.hotelPreferencesStart),
                    end: dbInstance.dateTimeAsString(tEvents.hotelPreferencesEnd),
                },
                refundRequests: {
                    start: dbInstance.dateTimeAsString(tEvents.refundRequestsStart),
                    end: dbInstance.dateTimeAsString(tEvents.refundRequestsEnd),
                },
                trainingPreferences: {
                    start: dbInstance.dateTimeAsString(tEvents.trainingPreferencesStart),
                    end: dbInstance.dateTimeAsString(tEvents.trainingPreferencesEnd),
                },
            })
            .executeSelectNoneOrOne() ?? { /* no availability windows */ };
    }

    return (
        <>
            { state === 'application' &&
                <ApplicationPage content={content} team={environment.environmentTeamDoNotUse}
                                 user={user} partnerApplications={partnerApplications}
                                 event={event.toEventData(environment.environmentName)} /> }
            { (state === 'status' && (registration && user)) &&
                <ApplicationStatusPage availabilityWindows={availabilityWindows} user={user}
                                       event={event.toEventData(environment.environmentName)}
                                       registration={registration.toRegistrationData()} /> }
            { state === 'unavailable' &&
                <Markdown sx={{ p: 2 }}>{content?.markdown}</Markdown> }
        </>
    );
}

export const generateMetadata = generatePortalMetadataFn('Application');

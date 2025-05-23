// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { NextPageParams } from '@lib/NextRouterParams';
import { type Content, getContent, getStaticContent } from '@lib/Content';
import { ApplicationPage, type ApplicationPageProps, type PartneringTeamApplication } from './ApplicationPage';
import { ApplicationStatusPage, type ApplicationStatusPageProps } from './ApplicationStatusPage';
import { Markdown } from '@components/Markdown';
import { contextForRegistrationPage } from '../contextForRegistrationPage';
import { generatePortalMetadataFn } from '../../generatePortalMetadataFn';
import db, { tEvents, tTeams, tUsersEvents } from '@lib/database';

import { kRegistrationStatus } from '@lib/database/Types';

/**
 * The <EventApplicationPage> component serves the ability for volunteers to either apply to join
 * one of our events, or for them to see the status of their current application.
 */
export default async function EventApplicationPage(props: NextPageParams<'slug'>) {
    const context = await contextForRegistrationPage(props.params);
    if (!context)
        notFound();

    const { access, environment, event, registration, teamSlug, user } = context;

    const eventAccessScope = { event: event.slug };
    const teamAccessScope = { event: event.slug, team: teamSlug };

    const canAccessAvailability = access.can('event.visible', teamAccessScope);
    const canAccessHotels = access.can('event.hotels', eventAccessScope);
    const canAccessRefunds = access.can('event.refunds', eventAccessScope);
    const canAccessSchedule = access.can('event.schedule.planning', 'read', teamAccessScope);
    const canAccessTrainings = access.can('event.trainings', eventAccessScope);

    let content: Content | undefined = undefined;
    let state: 'status' | 'application' | 'unavailable';

    if (registration && user) {
        state = 'status';
    } else {
        const environmentData = event.getEnvironmentData(environment.domain);
        if (environmentData?.enableApplications ||
                access.can('event.applications', 'create', teamAccessScope)) {
            content = await getContent(environment.domain, event, [ 'application' ]);
            state = 'application';
        } else {
            content = await getStaticContent([ 'registration', 'application', 'unavailable' ]);
            state = 'unavailable';
        }
    }

    let historicPreferences: ApplicationPageProps['historicPreferences'];
    let partnerApplications: PartneringTeamApplication[] = [];

    if (state === 'application' && user) {
        partnerApplications = await db.selectFrom(tUsersEvents)
            .innerJoin(tTeams)
                .on(tTeams.teamId.equals(tUsersEvents.teamId))
            .where(tUsersEvents.userId.equals(user.userId))
                .and(tUsersEvents.eventId.equals(event.eventId))
                .and(tUsersEvents.registrationStatus.in(
                    [ kRegistrationStatus.Registered, kRegistrationStatus.Accepted ]))
            .select({
                environment: tTeams.teamEnvironment,
                name: tTeams.teamName,
                status: tUsersEvents.registrationStatus,
            })
            .orderBy(tTeams.teamName, 'asc')
            .executeSelectMany();

        historicPreferences = await db.selectFrom(tUsersEvents)
            .innerJoin(tEvents)
                .on(tEvents.eventId.equals(tUsersEvents.eventId))
            .where(tUsersEvents.userId.equals(user.userId))
            .select({
                tshirtFit: tUsersEvents.shirtFit,
                tshirtSize: tUsersEvents.shirtSize,
            })
            .orderBy(tEvents.eventStartTime, 'desc')
            .limit(1)
            .executeSelectNoneOrOne() ?? undefined;
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
                <ApplicationPage content={content} team={teamSlug}
                                 user={user} partnerApplications={partnerApplications}
                                 event={event.toEventData(environment.domain)}
                                 historicPreferences={historicPreferences} /> }
            { (state === 'status' && (registration && user)) &&
                <ApplicationStatusPage availabilityWindows={availabilityWindows}
                                       canAccessAvailability={canAccessAvailability}
                                       canAccessHotels={canAccessHotels}
                                       canAccessRefunds={canAccessRefunds}
                                       canAccessSchedule={canAccessSchedule}
                                       canAccessTrainings={canAccessTrainings} user={user}
                                       event={event.toEventData(environment.domain)}
                                       registration={registration.toRegistrationData()} /> }
            { state === 'unavailable' &&
                <Markdown sx={{ p: 2 }}>{content?.markdown}</Markdown> }
        </>
    );
}

export const generateMetadata = generatePortalMetadataFn('Application');

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import { deepmerge } from '@mui/utils';

import type { Event } from '@lib/Event';
import type { NextPageParams } from '@lib/NextRouterParams';
import type { Registration } from '@lib/Registration';
import { AdditionalEventCard } from './welcome/AdditionalEventCard';
import { AdministrationCard } from './welcome/AdministrationCard';
import { RegistrationContentContainer } from '@app/registration/RegistrationContentContainer';
import { RegistrationLayout } from './registration/RegistrationLayout';
import { StatisticsCard } from './welcome/StatisticsCard';
import { Temporal, isBefore } from '@lib/Temporal';
import { WelcomeCard } from './welcome/WelcomeCard';
import { determineEnvironment } from '@lib/Environment';
import { generatePortalMetadataFn } from './registration/generatePortalMetadataFn';
import { getAuthenticationContext } from '@lib/auth/AuthenticationContext';
import { getEventsForUser } from './lib/EventLoader';
import { getRegistration } from './lib/RegistrationLoader';
import { kAnyEvent, kAnyTeam } from '@lib/auth/AccessList';

import { kRegistrationStatus } from '@lib/database/Types';

/**
 * Styles that apply to the photo card, displaying the environment's impression image.
 */
const kPhotoCardStyles: SxProps<Theme> = {
    height: '145px',

    backgroundPosition: 'top left',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    alignSelf: 'stretch',
};

/**
 * The main page of the entire Volunteer Manager. Will appeal to visitors to sign up to join one of
 * our volunteering teams, or send existing volunteers to one of various destinations.
 */
export default async function RootPage(props: NextPageParams<'ignored'>) {
    const environment = await determineEnvironment();
    if (!environment)
        notFound();

    const authenticationContext = await getAuthenticationContext();
    const { access, user } = authenticationContext;

    const currentTime = Temporal.Now.zonedDateTimeISO('utc');

    // TODO: Handle |environment| instances with non-LandingPage purposes
    // TODO: Handle |environment| instances with no teams
    // TODO: Handle |environment| instances with more than one team

    const defaultTeamSlug = environment.teams[0];

    // ---------------------------------------------------------------------------------------------

    // Load all events accessible to the |user|, and filter them for events that should be shown on
    // the overview page. Either registration or schedule access is required.
    const unfilteredEvents = await getEventsForUser(environment.domain, access, user);
    const events = unfilteredEvents.filter(event => {
        const accessScope = { event: event.slug, team: defaultTeamSlug };

        const data = event.getEnvironmentData(environment.domain);
        if (data?.enableRegistration || access.can('event.visible', accessScope))
            return true;  // access to the registration section

        if (data?.enableSchedule || access.can('event.schedule.access', { event: event.slug }))
            return true;  // access to the volunteering schedule

        return false;
    });

    // ---------------------------------------------------------------------------------------------

    const primaryEvent = events.shift();
    const primaryEventRegistration = primaryEvent && user && await getRegistration(
        environment.domain, primaryEvent, user.userId);

    const secondaryEvent = events.shift();
    const secondaryEventRegistration = secondaryEvent && user && await getRegistration(
        environment.domain, secondaryEvent, user.userId);

    // Determine the event for which the signed in user has registered, if any. This will consider
    // both the primary and secondary event, but only when they have not finished yet.
    let registrationEvent: Event | undefined;
    let registration: Registration | undefined;

    if (!!primaryEventRegistration) {
        registrationEvent = primaryEvent;
        registration = primaryEventRegistration;
    } else if (!!secondaryEventRegistration) {
        registrationEvent = secondaryEvent;
        registration = secondaryEventRegistration;
    }

    // ---------------------------------------------------------------------------------------------
    // Behaviour: For people who have installed the Volunteer Manager as a standalone app, the page
    // that will be loaded is "/?app". When this is the case, `registration` is set, and the event
    // with which the registration is associated has an accessible portal, redirect the user.

    if (Object.hasOwn(await props.searchParams, 'app')) {
        if (!!registration && !!registrationEvent) {
            const registrationEventData =
                registrationEvent.toEventData(environment.domain);

            const scheduleAccess =
                registrationEventData.enableSchedule ||
                access.can('event.schedule.access', { event: registrationEvent.slug });

            if (registration.status === kRegistrationStatus.Accepted && scheduleAccess)
                redirect(`/schedule/${registrationEvent.slug}`);
        }
        else if (access.can('system.feedback') &&
                     !access.can('event.visible', { event: kAnyEvent, team: kAnyTeam })) {
            redirect('/feedback');
        }
    }

    // ---------------------------------------------------------------------------------------------

    const buttons: React.ReactNode[] = [];

    // Modification: Hide the schedule button for the |primaryEvent| when the |secondaryEvent| has
    // not yet finished. This would be rather confusing for volunteers with elevated visibility.
    const hidePrimarySchedule =
        primaryEvent && secondaryEvent && isBefore(currentTime, secondaryEvent.temporalEndTime);

    for (const event of [ primaryEvent, secondaryEvent ]) {
        if (!event)
            continue;

        const accessScope = { event: event.slug, team: defaultTeamSlug };

        const eventData = event.toEventData(environment.domain);
        const eventRegistration = event === primaryEvent ? primaryEventRegistration
                                                         : secondaryEventRegistration;

        const displayRegistrationButton =
            eventData.enableRegistration || access.can('event.visible', accessScope);
        const displayScheduleButton =
            (eventData.enableSchedule && eventRegistration) ||
                access.can('event.schedule.access', { event: event.slug });

        const highlightRegistration =
            eventData.enableRegistration && isBefore(currentTime, event.temporalStartTime);
        const highlightSchedule =
            eventData.enableSchedule && isBefore(currentTime, event.temporalEndTime);

        if (displayScheduleButton && (!hidePrimarySchedule || event !== primaryEvent)) {
            buttons.push(
                <Button key={`${event.slug}-schedule`} component={Link}
                        href={`/schedule/${event.slug}`}
                        color={ eventData.enableSchedule ? 'primary' : 'hidden' }
                        variant={ highlightSchedule ? 'contained' : 'outlined' }>
                    {event.shortName} Volunteer Portal
                </Button>
            );
        }

        if (displayRegistrationButton) {
            buttons.push(
                <Button key={`${event.slug}-registration`} component={Link}
                        href={`/registration/${event.slug}`}
                        color={ eventData.enableRegistration ? 'primary' : 'hidden' }
                        variant={ highlightRegistration ? 'contained' : 'outlined' }>
                    Join the {event.shortName} {environment.title}!
                </Button>
            );
        }
    }

    // ---------------------------------------------------------------------------------------------

    const registrationEventData = registrationEvent?.toEventData(environment.domain);
    const registrationData = registration?.toRegistrationData();

    const landingStyle: SxProps<Theme> = {
        backgroundImage: `url('/images/${environment.domain}/landing.jpg')`
    };

    const enableAdministrationAccess = access.can('event.visible', {
        event: kAnyEvent,
        team: kAnyTeam,
    });

    const enableStatistics = access.can('statistics.basic');

    return (
        <RegistrationLayout environment={environment}>
            <RegistrationContentContainer title={`AnimeCon ${environment.title}`}
                                          event={registrationEventData}
                                          registration={registrationData}
                                          user={user}>
                <WelcomeCard description={environment.description} landingStyle={landingStyle}>

                    { buttons }
                    { buttons.length === 0 &&
                        <Alert severity="error">
                            We are not searching for volunteers for any upcoming AnimeCon events.
                        </Alert> }

                </WelcomeCard>

            </RegistrationContentContainer>

            <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid size={{ xs: 12, md: 0 }} sx={{ display: { xs: 'block', md: 'none' } }}>
                    <Card elevation={2} sx={ deepmerge(kPhotoCardStyles, landingStyle) } />
                </Grid>

                { enableAdministrationAccess &&
                    <Grid size={{ xs: 12, md: 4 }}>
                        <AdministrationCard />
                    </Grid> }

                { enableStatistics &&
                    <Grid size={{ xs: 12, md: 4 }}>
                        <StatisticsCard />
                    </Grid> }

                { events.map(event => {
                    const accessScope = { event: event.slug, team: defaultTeamSlug };
                    const data = event.getEnvironmentData(environment.domain);

                    const enableRegistration =
                        data?.enableRegistration || access.can('event.visible', accessScope);

                    const enableSchedule =
                        data?.enableSchedule ||
                        access.can('event.schedule.access', { event: event.slug });

                    return (
                        <Grid key={event.slug} size={{ xs: 12, md: 4 }}>
                            <AdditionalEventCard name={event.name} slug={event.slug}
                                                 enableRegistration={enableRegistration}
                                                 enableSchedule={enableSchedule} />
                        </Grid>
                    );
                } )}

            </Grid>
        </RegistrationLayout>
    );
}

export const generateMetadata = generatePortalMetadataFn();

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import type { SxProps, Theme } from '@mui/system';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import Grid from '@mui/material/Unstable_Grid2';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import type { EventDataWithEnvironment } from '@lib/Event';
import type { RegistrationData } from '@lib/Registration';
import type { UserData } from '@lib/auth/UserData';
import { DateTime } from '@lib/DateTime';
import { Markdown } from '@components/Markdown';
import { Privilege, can } from '@lib/auth/Privileges';
import { RegistrationContentContainer } from '@app/registration/RegistrationContentContainer';

/**
 * Manual styles that apply to the <WelcomePage> client component.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    eventCardActions: {
        alignItems: 'start',
        flexDirection: 'column',
        pt: { md: 2 },

        '&>a>:first-of-type': { px: 1 },
        '&>:not(:first-of-type)': {
            px: 0,
            m: 0,
        },
    },
    hiddenCardActions: {
        '&>a>:first-of-type': { px: 1 },
    },
    landingPage: {
        minHeight: { md: 340 },
        mt: 0,
        mr: '-0.5px' /* ... */
    },
    photo: {
        backgroundImage: 'url(/images/stewards.team/photo-landing-1.jpg)',
        backgroundPosition: 'top left',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        borderBottomRightRadius: 4,
        alignSelf: 'stretch',
    },
};

/**
 * Properties accepted by the <WelcomePage> client component.
 */
export interface WelcomePageProps {
    /**
     * The events (zero or more) the current visitor has access to. The events should be sorted in
     * descending order based on the dates during which they will take place.
     */
    events: EventDataWithEnvironment[];

    /**
     * The User the current visitor is signed in as, if any.
     */
    user?: UserData;

    /**
     * The event for which the signed in volunteer may have registered.
     */
    registrationEvent?: EventDataWithEnvironment;

    /**
     * The registration the signed in volunteer may have created for the current event.
     */
    registration?: RegistrationData;

    /**
     * Title of the page that should be displayed at the top. Dependent on the environment.
     */
    title: string;

    /**
     * Description of the functions of the team that this page represents.
     */
    description: string;
}

/**
 * The welcome page is the domain's root page, which routes the user to applicable applications. For
 * most visitors (who are not signed in) this includes registration for the latest event and the
 * ability to sign-in to access the portal, whereas more senior volunteers will also see buttons
 * towards the Admin and Statistics apps.
 */
export function WelcomePage(props: WelcomePageProps) {
    const { user } = props;

    const additionalEvents: EventDataWithEnvironment[] = [];

    const adminAccess = new Set<number>();
    for (const eventInfo of user?.events ?? [ /* no events */ ]) {
        if (eventInfo.adminAccess)
            adminAccess.add(eventInfo.eventId);
    }

    const eventContentOverride = can(user, Privilege.EventContentOverride);
    const eventScheduleOverride = can(user, Privilege.EventScheduleOverride);
    const currentTime = DateTime.Now();

    let upcomingEvent: EventDataWithEnvironment | undefined;
    let currentEvent: EventDataWithEnvironment | undefined;

    for (const event of props.events) {
        const eventTime = DateTime.From(event.endTime);
        if (eventTime.isAfter(currentTime, 'date') && !upcomingEvent)
            upcomingEvent = event;
        else if (!currentEvent)
            currentEvent = event;
        else
            additionalEvents.push(event);
    }

    const shouldHighlight = (value: boolean) => value ? 'contained' : 'outlined';

    const hiddenIcon =
        <Tooltip title="Access is limited to certain volunteers">
            <VisibilityOffIcon fontSize="small" color="disabled" />
        </Tooltip>;

    return (
        <>
            <RegistrationContentContainer title={`AnimeCon ${props.title}`}
                                          event={props.registrationEvent}
                                          registration={props.registration}
                                          user={user}>

                { /* Section: Landing page */ }
                <Grid container spacing={2} alignItems="center" sx={kStyles.landingPage}>
                    <Grid xs={12} md={5}>
                        <Markdown sx={{ px: 2 }}>
                            {props.description}
                        </Markdown>
                        <Stack direction="column" spacing={2} sx={{ p: 2, mt: 1 }}>
                            { /* TODO: Participating volunteers should see "access" first */ }

                            { (upcomingEvent &&
                                    (upcomingEvent.enableContent || eventContentOverride ||
                                        adminAccess.has(upcomingEvent.id))) &&
                                <Button component={Link}
                                        href={`/registration/${upcomingEvent.slug}/`}
                                        color={upcomingEvent.enableContent ? 'primary' : 'hidden'}
                                        endIcon={upcomingEvent.enableContent ? null : hiddenIcon}
                                        variant={shouldHighlight(upcomingEvent.enableContent)}>
                                    Join the {upcomingEvent.shortName} {props.title}!
                                </Button> }

                            { (upcomingEvent &&
                                    (upcomingEvent.enableSchedule || eventScheduleOverride ||
                                        adminAccess.has(upcomingEvent.id))) &&
                                <Button component={Link}
                                        href={`/schedule/${upcomingEvent.slug}/`}
                                        color={upcomingEvent.enableSchedule ? 'primary' : 'hidden'}
                                        endIcon={upcomingEvent.enableSchedule ? null : hiddenIcon}
                                        variant="outlined">
                                    {upcomingEvent.shortName} Volunteer Portal
                                </Button> }

                            { (currentEvent &&
                                    (currentEvent.enableContent || eventContentOverride ||
                                        adminAccess.has(currentEvent.id))) &&
                                <Button component={Link}
                                        href={`/registration/${currentEvent.slug}/`}
                                        color={currentEvent.enableContent ? 'primary' : 'hidden'}
                                        endIcon={currentEvent.enableContent ? null : hiddenIcon}
                                        variant={shouldHighlight(currentEvent.enableContent)}>
                                    Join the {currentEvent.shortName} {props.title}!
                                </Button> }

                            { (currentEvent &&
                                    (currentEvent.enableSchedule || eventScheduleOverride ||
                                        adminAccess.has(currentEvent.id))) &&
                                <Button component={Link}
                                        href={`/schedule/${currentEvent.slug}/`}
                                        color={currentEvent.enableSchedule ? 'primary' : 'hidden'}
                                        endIcon={currentEvent.enableSchedule ? null : hiddenIcon}
                                        variant="outlined">
                                    {currentEvent.shortName} Volunteer Portal
                                </Button> }

                        </Stack>
                    </Grid>
                    <Grid xs={0} md={7} sx={kStyles.photo}>
                        { /* TODO: Multiple photos per environment */ }
                    </Grid>
                </Grid>

            </RegistrationContentContainer>

            { /* Section: Further content */ }
            <Grid container spacing={2} sx={{ mt: 2 }}>
                { !!adminAccess.size &&
                    <Grid xs={12} md={4}>
                        <Card elevation={2}>
                            <CardContent sx={{ pb: 0 }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography variant="h5" component="p">
                                        Administration
                                    </Typography>
                                    {hiddenIcon}
                                </Stack>
                                <Typography variant="body2">
                                    Access to the administration area where we manage the events,
                                    volunteers and scheduling.
                                </Typography>
                            </CardContent>
                            <CardActions sx={kStyles.hiddenCardActions}>
                                <Link href="/admin" passHref>
                                    <Button size="small" startIcon={ <ExitToAppIcon />}>
                                        Launch
                                    </Button>
                                </Link>
                            </CardActions>
                        </Card>
                    </Grid> }

                { can(user, Privilege.Statistics) &&
                    <Grid xs={12} md={4}>
                        <Card elevation={2}>
                            <CardContent sx={{ pb: 0 }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography variant="h5" component="p">
                                        Statistics
                                    </Typography>
                                    {hiddenIcon}
                                </Stack>
                                <Typography variant="body2">
                                    Multi-year statistics about the demographics, scope and
                                    performance of the {props.title}.
                                </Typography>
                            </CardContent>
                            <CardActions sx={kStyles.hiddenCardActions}>
                                <Link href="/statistics" passHref>
                                    <Button size="small" startIcon={ <ExitToAppIcon />}>
                                        Launch
                                    </Button>
                                </Link>
                            </CardActions>
                        </Card>
                    </Grid> }

                { additionalEvents.map(event =>
                    <Grid key={event.slug} xs={12} md={4}>
                        <Card elevation={2}>
                            <CardContent sx={{ pb: 0 }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography variant="h5" component="p" noWrap>
                                        {event.name}
                                    </Typography>
                                    <Tooltip title="Access is limited to selected volunteers">
                                        <VisibilityOffIcon fontSize="small" color="disabled" />
                                    </Tooltip>
                                </Stack>
                            </CardContent>
                            <CardActions sx={kStyles.eventCardActions}>
                                { (event.enableContent || adminAccess.has(event.id) ||
                                       eventContentOverride) &&
                                    <Link href={`/registration/${event.slug}/`} passHref>
                                        <Button size="small" startIcon={ <HowToRegIcon />}>
                                            Registration
                                        </Button>
                                    </Link> }
                                { (event.enableSchedule || adminAccess.has(event.id) ||
                                       eventScheduleOverride) &&
                                    <Link href={`/schedule/${event.slug}/`} passHref>
                                        <Button size="small" startIcon={ <EventNoteIcon />}>
                                            Volunteer Portal
                                        </Button>
                                    </Link> }
                            </CardActions>
                        </Card>
                    </Grid> )}
            </Grid>
        </>
    );
}

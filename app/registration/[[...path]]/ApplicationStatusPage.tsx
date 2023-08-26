// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import Box from '@mui/material/Box';
import EventNoteIcon from '@mui/icons-material/EventNote';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import MuiLink from '@mui/material/Link';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import Typography from '@mui/material/Typography';

import type { EventDataWithEnvironment } from '@lib/Event';
import type { RegistrationData } from '@lib/Registration';
import type { UserData } from '@app/lib/auth/UserData';
import { Privilege, can } from '@app/lib/auth/Privileges';
import { RegistrationStatus } from '@app/lib/database/Types';

/**
 * Props accepted by the <ApplicationStatusPage> page.
 */
export interface ApplicationStatusPageProps {
    /**
     * The event for which data is being displayed on this page.
     */
    event: EventDataWithEnvironment;

    /**
     * Information about the user's existing registration.
     */
    registration: RegistrationData;

    /**
     * The user who is currently signed in. We require someone to be signed in when applying, as
     * it helps carry their participation information across multiple events.
     */
    user: UserData;
}

/**
 * The <ApplicationStatusPage> component confirms to a user that their application has been
 * retrieved by the team's leads and the status of its consideration.
 */
export function ApplicationStatusPage(props: ApplicationStatusPageProps) {
    const { event, registration, user } = props;

    let label: string;
    let explanation: string;

    switch (registration.status) {
        case RegistrationStatus.Registered:
            label = 'received';
            explanation =
                'The leads are considering it and will confirm your participation as soon as ' +
                'possible.';
            break;

        case RegistrationStatus.Accepted:
            label = 'accepted';
            explanation =
                'We\'ve confirmed your participation and are really excited to get to work ' +
                `with you during ${event.shortName}!`;
            break;

        case RegistrationStatus.Cancelled:
        case RegistrationStatus.Rejected:
            label = registration.status === 'Cancelled' ? 'cancelled' : 'declined';
            explanation =
                'We\'re sorry that you won\'t be participating in this team during ' +
                event.shortName + '.';
            break;
    }

    const scheduleAvailable = event.enableSchedule || can(user, Privilege.EventScheduleOverride);

    const showAvailability = scheduleAvailable || registration.availability;
    const showHotel = registration.hotelEligible || registration.hotel;

    // TODO: Show basic details about their hotel room booking.

    const sp = ' ';  // thanks React
    return (
        <>
            <Box sx={{ p: 2 }}>
                <Typography variant="body1">
                    {user.firstName}, your application has been {label}. {explanation} Please
                    e-mail{sp}
                    <MuiLink component={Link} href="mailto:crew@animecon.nl">
                        crew@animecon.nl
                    </MuiLink>
                    {sp}in case you have any questions.
                </Typography>
            </Box>
            { registration.status === 'Accepted' &&
                <>
                    <Typography variant="body1" sx={{ px: 2 }}>
                        The follow options are available regarding your registration:
                    </Typography>
                    <List>
                        <ListItem sx={{ pl: 4 }}>
                            <ListItemIcon>
                                <TaskAltIcon color="success" />
                            </ListItemIcon>
                            <ListItemText primary="Your application has been accepted!"
                                          secondary="Nothing more to do there…" />
                        </ListItem>

                        <ListItemButton
                            LinkComponent={Link} sx={{ pl: 4 }}
                            disabled={!showAvailability}
                            href={`/registration/${event.slug}/application/availability`}>

                            <ListItemIcon>
                                { registration.availability && <TaskAltIcon color="success" /> }
                                { !registration.availability &&
                                    <RadioButtonUncheckedIcon color="warning" /> }
                            </ListItemIcon>

                            { registration.availability &&
                                <ListItemText
                                    primary="You've shared your availability"
                                    secondary="This will help in creating your schedule" /> }

                            { (!registration.availability && !scheduleAvailable) &&
                                <ListItemText
                                    primary="Submit your availability information"
                                    secondary="The schedule has not been published yet" /> }

                            { (!registration.availability && scheduleAvailable) &&
                                <ListItemText
                                    primary="Submit your availability information"
                                    secondary="This will help in creating your schedule" /> }

                        </ListItemButton>

                        { showHotel &&
                            <ListItemButton
                                LinkComponent={Link} sx={{ pl: 4 }}
                                disabled={!registration.hotelAvailable}
                                href={`/registration/${event.slug}/application/hotel`}>

                                <ListItemIcon>
                                    { registration.hotel && <TaskAltIcon color="success" /> }
                                    { !registration.hotel &&
                                        <RadioButtonUncheckedIcon color="warning" /> }
                                </ListItemIcon>

                                { registration.hotel &&
                                    <ListItemText
                                        primary="TODO (requested or booked or declined)"
                                        secondary="TODO (requested or booked or declined)" /> }

                                { (!registration.hotel && !registration.hotelAvailable) &&
                                    <ListItemText
                                        primary="Request (or decline) a hotel room booking"
                                        secondary="Hotel prices have not been published yet" /> }

                                { (!registration.hotel && registration.hotelAvailable) &&
                                    <ListItemText
                                        primary="Request (or decline) a hotel room booking"
                                        secondary="We'd be happy to reserve one for you" /> }

                            </ListItemButton> }

                        <ListItemButton LinkComponent={Link} sx={{ pl: 4 }}
                                        disabled={!scheduleAvailable}
                                        href={`/schedule/${event.slug}`}>

                            <ListItemIcon>
                                <EventNoteIcon />
                            </ListItemIcon>

                            { scheduleAvailable &&
                                <ListItemText
                                    primary={`${event.shortName} Volunteer Portal`}
                                    secondary="Check your schedule and the festival's program" /> }

                            { !scheduleAvailable &&
                                <ListItemText
                                    primary={`${event.shortName} Volunteer Portal`}
                                    secondary="The volunteer portal is not yet available" /> }


                        </ListItemButton>

                    </List>
                </> }
        </>
    );
}

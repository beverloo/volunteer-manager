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
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

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

    let hasAdminAccess = false;
    for (const { eventId, adminAccess } of user.events) {
        if (eventId !== event.id || !adminAccess)
            continue;

        hasAdminAccess = true;
        break;
    }

    // Display and enablement of availability preferences.
    const displayAvailability = registration.availabilityEligible || !!registration.availability;
    const enableAvailability = registration.availabilityAvailable;
    const enableAvailabilityWithOverride =
        enableAvailability || can(user, Privilege.EventScheduleOverride);

    // Display and enablement of hotel booking preferences.
    const displayHotel = registration.hotelEligible || !!registration.hotel;
    const enableHotel = registration.hotelAvailable;
    const enableHotelWithOverride = enableHotel || can(user, Privilege.EventHotelManagement);

    // Display and enablement of training preferences.
    const displayTraining = registration.trainingEligible || !!registration.training;
    const enableTraining = registration.trainingAvailable;
    const enableTrainingWithOverride =
        enableTraining || can(user, Privilege.EventTrainingManagement);

    const enableSchedule = event.enableSchedule;
    const enableScheduleWithOverride = enableSchedule || can(user, Privilege.EventScheduleOverride);

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
                            <ListItemText primary="Your application has been accepted!" />
                        </ListItem>

                        { displayAvailability &&
                            <ListItemButton
                                LinkComponent={Link} sx={{ pl: 4 }}
                                disabled={!enableAvailabilityWithOverride}
                                href={`/registration/${event.slug}/application/availability`}>

                                <ListItemIcon>
                                    { registration.availability && <TaskAltIcon color="success" /> }
                                    { !registration.availability &&
                                        <RadioButtonUncheckedIcon color="warning" /> }
                                </ListItemIcon>

                                { registration.availability &&
                                    <ListItemText
                                        primary="You've shared your availability"
                                        secondary="This will help in creating your schedule." /> }

                                { (!registration.availability && !enableAvailability) &&
                                    <ListItemText
                                        primary="Submit your availability information"
                                        secondary="The schedule has not been published yet…" /> }

                                { (!registration.availability && enableAvailability) &&
                                    <ListItemText
                                        primary="Submit your availability information"
                                        secondary="This will help in creating your schedule." /> }

                                { (!enableAvailability && enableAvailabilityWithOverride) &&
                                    <Tooltip title="Access is limited to certain volunteers">
                                        <VisibilityOffIcon color="warning" sx={{ mr: 2 }} />
                                    </Tooltip> }

                            </ListItemButton> }

                        { displayHotel &&
                            <ListItemButton
                                LinkComponent={Link} sx={{ pl: 4 }}
                                disabled={!enableHotelWithOverride}
                                href={`/registration/${event.slug}/application/hotel`}>

                                <ListItemIcon>
                                    { (registration.hotel && !registration.hotel.hotelName) &&
                                        <TaskAltIcon color="success" /> }
                                    { (registration.hotel && !!registration.hotel.hotelName) &&
                                        <RadioButtonUncheckedIcon color="success" /> }
                                    { !registration.hotel &&
                                        <RadioButtonUncheckedIcon color="warning" /> }
                                </ListItemIcon>

                                { (registration.hotel && !registration.hotel.hotelName) &&
                                    <ListItemText
                                        primary="You've declined a hotel room booking" /> }

                                { (registration.hotel && !!registration.hotel.hotelName) &&
                                    <ListItemText
                                        primary="You've requested a hotel room booking"
                                        secondary={
                                            `${registration.hotel.hotelRoom} room in the ` +
                                            `${registration.hotel.hotelName}` } /> }

                                { (!registration.hotel && !enableHotel) &&
                                    <ListItemText
                                        primary="Request (or decline) a hotel room booking"
                                        secondary="Hotel prices have not been published yet…" /> }

                                { (!registration.hotel && enableHotel) &&
                                    <ListItemText
                                        primary="Request (or decline) a hotel room booking"
                                        secondary="We'd be happy to reserve one for you" /> }

                                { (!enableHotel && enableHotelWithOverride) &&
                                    <Tooltip title="Access is limited to certain volunteers">
                                        <VisibilityOffIcon color="warning" sx={{ mr: 2 }} />
                                    </Tooltip> }

                            </ListItemButton> }

                        { displayTraining &&
                            <ListItemButton
                                LinkComponent={Link} sx={{ pl: 4 }}
                                disabled={!enableTrainingWithOverride}
                                href={`/registration/${event.slug}/application/training`}>

                                <ListItemIcon>
                                    { registration.training && <TaskAltIcon color="success" /> }
                                    { !registration.training &&
                                        <RadioButtonUncheckedIcon color="warning" /> }
                                </ListItemIcon>

                                { registration.training &&
                                    <ListItemText
                                        primary="TODO"
                                        secondary="TODO" /> }

                                { (!registration.training && !enableTraining) &&
                                    <ListItemText
                                        primary="Participate in our professional training"
                                        secondary="Dates have not been published yet…" /> }

                                { (!registration.training && enableTraining) &&
                                    <ListItemText
                                        primary="Participate in our professional training"
                                        secondary="Indicate when (& if) you'd like to join!" /> }

                                { (!enableTraining && enableTrainingWithOverride) &&
                                    <Tooltip title="Access is limited to certain volunteers">
                                        <VisibilityOffIcon color="warning" sx={{ mr: 2 }} />
                                    </Tooltip> }

                            </ListItemButton> }

                        <ListItemButton LinkComponent={Link} sx={{ pl: 4 }}
                                        disabled={!enableScheduleWithOverride}
                                        href={`/schedule/${event.slug}`}>

                            <ListItemIcon>
                                <EventNoteIcon />
                            </ListItemIcon>

                            { enableSchedule &&
                                <ListItemText
                                    primary={`${event.shortName} Volunteer Portal`}
                                    secondary="Check your schedule and the festival's program" /> }

                            { !enableSchedule &&
                                <ListItemText
                                    primary={`${event.shortName} Volunteer Portal`}
                                    secondary="The volunteer portal is not yet available" /> }

                            { (!enableSchedule && enableScheduleWithOverride) &&
                                    <Tooltip title="Access is limited to certain volunteers">
                                        <VisibilityOffIcon color="warning" sx={{ mr: 2 }} />
                                    </Tooltip> }

                        </ListItemButton>

                    </List>
                </> }
        </>
    );
}

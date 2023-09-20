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
import type { UserData } from '@lib/auth/UserData';
import { Privilege, can } from '@lib/auth/Privileges';
import { RegistrationStatus } from '@lib/database/Types';
import { dayjs } from '@lib/DateTime';

/**
 * Props accepted by the <HotelStatusButton> component.
 */
interface HotelStatusButtonProps {
    /**
     * Bookings that were created on behalf of the volunteer.
     */
    bookings: RegistrationData['hotelBookings'];

    /**
     * Whether the button should be enabled by default, i.e. has information been published?
     */
    enabled: boolean;

    /**
     * Whether the volunteer has the ability to override normal access restrictions.
     */
    override: boolean;

    /**
     * Preferences the volunteer indicated regarding their hotel room bookings.
     */
    preferences: RegistrationData['hotelPreferences'];
}

/**
 * The <HotelStatusButton> component displays the status of the volunteer's hotel room preferences
 * and booking(s). This is a multi-step process involving quite a lot of manual back-and-forth.
 *
 * This button deals with a number of situations:
 *   (1) The volunteer has one or more confirmed hotel room bookings.
 *   (2) The volunteer indicated their preferences, wants a room and is awaiting confirmation.
 *   (3) The volunteer indicated their preferences and does not want a room.
 *   (4) The volunteer is able to indicate their preferences, but has not done so yet.
 *   (5) The volunteer is not able to indicate their preferences yet.
 *
 * It's possible for a volunteer to have more than one hotel room booking, significant because there
 * might be a different booking for e.g. Thursday to Friday compared to Friday to Sunday.
 */
function HotelStatusButton(props: HotelStatusButtonProps) {
    const { bookings, enabled, override, preferences } = props;

    let status: 'pending' | 'submitted' | 'confirmed' = 'pending';
    let primary: string | undefined = undefined;
    let secondary: string | undefined = undefined;

    // (1) The volunteer has one or more confirmed hotel room bookings.
    if (bookings.length > 0) {
        status = 'confirmed';

        let hotel: string;
        if (bookings.length > 1) {
            hotel = ` ${bookings.length} different rooms`;
            primary = `You've got ${bookings.length} confirmed hotel room bookings`;
        } else {
            hotel = ` the ${bookings[0].hotel.name}`;
            primary = 'Your hotel room booking has been confirmed';
        }

        let earliestCheckIn = dayjs('2099-12-31 23:59:59');
        let latestCheckOut = dayjs('1999-01-01 00:00:00');

        for (const booking of bookings) {
            if (earliestCheckIn.isAfter(booking.checkIn))
                earliestCheckIn = dayjs(booking.checkIn);
            if (latestCheckOut.isBefore(booking.checkOut))
                latestCheckOut = dayjs(booking.checkOut);
        }

        secondary  = `${earliestCheckIn.format('dddd')} until ${latestCheckOut.format('dddd')}, in`;
        secondary += hotel;
    } else if (!!preferences) {
        // (2) The volunteer indicated their preferences, wants a room and is awaiting confirmation.
        if (!!preferences.hotelName) {
            status = 'submitted';
            primary = `You've requested a room in the ${preferences.hotelName}`;
            secondary = 'We\'ll confirm the reservation closer to the convention';

        // (3) The volunteer indicated their preferences and does not want a room.
        } else {
            status = 'confirmed';
            primary = 'You don\'t need a hotel room booking';
        }
    } else {
        // (4) The volunteer is able to indicate their preferences, but has not done so yet.
        primary = 'Do you want to reserve a hotel room?';

        // (5) The volunteer is not able to indicate their preferences yet.
        if (!enabled)
            secondary = 'Hotel information has not been published yet';
    }

    return (
        <ListItemButton LinkComponent={Link} sx={{ pl: 4 }}
                        disabled={!enabled && !override}
                        href="./application/hotel">

            <ListItemIcon>
                { status === 'confirmed' && <TaskAltIcon color="success" /> }
                { status === 'submitted' && <RadioButtonUncheckedIcon color="success" /> }
                { status === 'pending' && <RadioButtonUncheckedIcon color="warning" /> }
            </ListItemIcon>

            <ListItemText primary={primary} secondary={secondary} />

            { (!enabled && override) &&
                <Tooltip title="Access is limited to certain volunteers">
                    <VisibilityOffIcon color="warning" sx={{ mr: 2 }} />
                </Tooltip> }

        </ListItemButton>
    );
}

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
    const displayHotel = registration.hotelEligible || !!registration.hotelPreferences ||
                         registration.hotelBookings.length > 0;

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
                            <HotelStatusButton bookings={registration.hotelBookings}
                                               enabled={registration.hotelAvailable}
                                               override={can(user, Privilege.EventHotelManagement)}
                                               preferences={registration.hotelPreferences} /> }

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

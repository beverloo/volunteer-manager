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
import type { RegistrationData, RegistrationTraining } from '@lib/Registration';
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
            secondary = 'Hotel information has not been published yet…';
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
                <Tooltip title="Access is limited to hotel booking managers">
                    <VisibilityOffIcon color="warning" sx={{ mr: 2 }} />
                </Tooltip> }

        </ListItemButton>
    );
}

/**
 * Props accepted by the <TrainingStatusButton> component.
 */
interface TrainingStatusButtonProps {
    /**
     * Whether the button should be enabled by default, i.e. has information been published?
     */
    enabled: boolean;

    /**
     * Whether the volunteer has the ability to override normal access restrictions.
     */
    override: boolean;

    /**
     * Information about the volunteer's preferences regarding participating in the training.
     */
    training?: RegistrationTraining;
}

/**
 * The <TrainingStatusButton> component displays the volunteer's participation in the training
 * sessions organised for the Stewards. This is a multi-step process involving back and forth.
 *
 * This button deals with a number of situations:
 *   (1) The volunteer has a confirmed spot in one of the sessions.
 *   (2) The volunteer indicated their preferences, wants to join and waits for confirmation.
 *   (3) The volunteer indicated their preferences and is confirmed to not to participate.
 *   (4) The volunteer indicated their preferences and does not want to participate.
 *   (5) The volunteer is able to indicate their preferences, but has not done so yet.
 *   (6) The volunteer is not able to indicate their preferences yet.
 *
 * Volunteers can only join a single training session. It's possible for seniors to join multiple
 * training sessions, but we'll handle those out-of-bounds.
 */
function TrainingStatusButton(props: TrainingStatusButtonProps) {
    const { enabled, override, training } = props;

    let status: 'pending' | 'submitted' | 'confirmed' = 'pending';
    let primary: string | undefined = undefined;
    let secondary: string | undefined = undefined;

    if (!!training && !!training.preferenceDate) {
        // (1) The volunteer has a confirmed spot in one of the sessions.
        if (training.confirmed && !!training.assignedDate) {
            const assignedDate = dayjs(training.preferenceDate).format('dddd, MMMM D');
            const assignedTime = dayjs(training.assignedDate).format('H:mm');

            status = 'confirmed';
            primary = `You'll join the training on ${assignedDate}`;
            secondary = `It starts at ${assignedTime}, please make sure to be there on time`;

        // (2) The volunteer indicated their preferences, wants to join and waits for confirmation.
        } else {
            const preferenceDate = dayjs(training.preferenceDate).format('dddd, MMMM D');
            status = 'submitted';
            primary = `You'd like to join the training on ${preferenceDate}`;
            secondary = 'This will be confirmed by one of the leads closer to the event…';
        }
    }

    else if (!!training && !training.preferenceDate) {
        // (3) The volunteer indicated their preferences and is confirmed to not to participate.
        if (training.confirmed) {
            status = 'confirmed';
            primary = 'You\'ll skip the professional training this year'

        // (4) The volunteer indicated their preferences and does not want to participate.
        } else {
            status = 'submitted';
            primary = 'You would like to skip the training this year';
            secondary = 'This will be confirmed by one of the leads closer to the event…';
        }
    }

    else {
        // (5) The volunteer is able to indicate their preferences, but has not done so yet.
        primary = 'Do you want to join our professional training?';

        // (6) The volunteer is not able to indicate their preferences yet.
        if (!enabled)
            secondary = 'Training information has not been published yet…';
    }

    return (
        <ListItemButton LinkComponent={Link} sx={{ pl: 4 }}
                        disabled={!enabled && !override}
                        href="./application/training">

            <ListItemIcon>
                { status === 'confirmed' && <TaskAltIcon color="success" /> }
                { status === 'submitted' && <RadioButtonUncheckedIcon color="success" /> }
                { status === 'pending' && <RadioButtonUncheckedIcon color="warning" /> }
            </ListItemIcon>

            <ListItemText primary={primary} secondary={secondary} />

            { (!enabled && override) &&
                <Tooltip title="Access is limited to training managers">
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

    // Display and enablement of hotel booking preferences.
    const displayHotel = registration.hotelEligible || !!registration.hotelPreferences ||
                         registration.hotelBookings.length > 0;

    // Display and enablement of training preferences.
    const displayTraining = registration.trainingEligible || !!registration.training;

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

                        { displayHotel &&
                            <HotelStatusButton bookings={registration.hotelBookings}
                                               enabled={registration.hotelAvailable}
                                               override={can(user, Privilege.EventHotelManagement)}
                                               preferences={registration.hotelPreferences} /> }

                        { displayTraining &&
                            <TrainingStatusButton enabled={registration.trainingAvailable}
                                                  override={
                                                      can(user, Privilege.EventTrainingManagement)
                                                  }
                                                  training={registration.training} /> }

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

// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import EditNoteIcon from '@mui/icons-material/EditNote';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import NotesIcon from '@mui/icons-material/Notes';
import PhoneIcon from '@mui/icons-material/Phone';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import { Avatar } from '@components/Avatar';
import { ErrorCard } from '../../components/ErrorCard';
import { ListItemDetails } from '../../components/ListItemDetails';
import { NotesCard } from '../../components/NotesCard';
import { ScheduleContext } from '../../ScheduleContext';
import { SetTitle } from '../../components/SetTitle';
import { SubHeader } from '../../components/SubHeader';
import { callApi } from '@lib/callApi';
import { currentTimestamp, toZonedDateTime } from '../../CurrentTime';
import { formatDate } from '@lib/Temporal';

import { kLogicalDayChangeHour } from '../../lib/isDifferentDay';

const NotesEditorDialog = dynamic(() => import('../../components/NotesEditorDialog'), {
    ssr: false,
});

/**
 * Sorted and associated information regarding the shifts assigned to a volunteer, grouped together
 * in any number of sections, generally days.
 */
interface ScheduledShiftsSection {
    /**
     * Label to assign to the section of scheduled shifts.
     */
    label: string;

    /**
     * Whether a divider should be shown ahead of this section.
     */
    divider: boolean;

    /**
     * Whether the day has finished already. Only included to enable sorting the results.
     */
    finished: boolean;

    /**
     * The shifts that are part of this section.
     */
    shifts: {
        /**
         * Unique ID of this section.
         */
        id: string;

        /**
         * Unique ID of the activity this shift is associated with. Will be used to linkify.
         */
        activity: string;

        /**
         * Name of the shift that the volunteer will be working on.
         */
        name: string;

        /**
         * Time at which the shift will start.
         */
        start: string;

        /**
         * Time at which the shift will end.
         */
        end: string;

        /**
         * Time at which the shift will start, as a UNIX timestamp. Only included for sorting
         * purposes, should not be used to present to the user.
         */
        startTime: number;

        /**
         * Whether the shift has finished already. Only included to enable sorting the results.
         */
        finished: boolean;

        /**
         * Optional styling that should be applied to this shift entry.
         */
        sx?: SxProps<Theme>;
    }[];
}

/**
 * Props accepted by the <VolunteerPageProps> component.
 */
export interface VolunteerPageProps {
    /**
     * Unique ID of the volunteer for whom the page should be shown.
     */
    userId: string;
}

/**
 * The <VolunteerPage> page displays an overview page of an individual volunteer, including their
 * details, contact information (when available), notes and shifts.
 */
export function VolunteerPage(props: VolunteerPageProps) {
    const { refresh, schedule } = useContext(ScheduleContext);

    const router = useRouter();

    // ---------------------------------------------------------------------------------------------
    // Scheduled shifts:
    // ---------------------------------------------------------------------------------------------

    const scheduledShifts = useMemo(() => {
        const scheduledShifts: ScheduledShiftsSection[] = [ /* empty */ ];
        if (!schedule || !schedule.volunteers.hasOwnProperty(props.userId))
            return scheduledShifts;  // incomplete |schedule|

        const currentTime = currentTimestamp();

        const scheduledShiftSections = new Map<string, ScheduledShiftsSection['shifts'][number][]>;
        for (const scheduledShiftId of schedule.volunteers[props.userId].schedule) {
            const scheduledShift = schedule.schedule[scheduledShiftId];
            const shift = schedule.shifts[scheduledShift.shift];

            const start = toZonedDateTime(scheduledShift.start);
            const end = toZonedDateTime(scheduledShift.end);

            // We consider shifts that end before the `kLogicalDayChangeHour` to be part of the
            // previous day, to avoid volunteer confusion about when shifts are meant to take place.
            let startForSection = start;
            if (!!schedule.config.enableLogicalDays && end.hour <= kLogicalDayChangeHour)
                startForSection = start.subtract({ hours: kLogicalDayChangeHour });

            const section = formatDate(startForSection, 'dddd');
            if (!scheduledShiftSections.has(section))
                scheduledShiftSections.set(section, [ /* empty */ ]);

            let sx: SxProps<Theme> | undefined;
            if (scheduledShift.end <= currentTime) {
                sx = {
                    backgroundColor: 'animecon.pastBackground',
                    textDecoration: 'line-through',
                    textDecorationColor: theme => theme.palette.animecon.pastForeground,
                    '&:hover': {
                        backgroundColor: 'animecon.pastBackgroundHover',
                        textDecoration: 'line-through',
                        textDecorationColor: theme => theme.palette.animecon.pastForeground,
                    },
                };
            } else if (scheduledShift.start <= currentTime) {
                sx = {
                    backgroundColor: 'animecon.activeBackground',
                    '&:hover': {
                        backgroundColor: 'animecon.activeBackgroundHover',
                    },
                };
            }

            scheduledShiftSections.get(section)!.push({
                id: scheduledShiftId,
                activity: shift.activity,
                name: shift.name,
                start: formatDate(start, 'HH:mm'),
                startTime: scheduledShift.start,
                finished: scheduledShift.end <= currentTime,
                end: formatDate(end, 'HH:mm'),
                sx,
            });
        }

        for (const [ label, shifts ] of scheduledShiftSections.entries()) {
            shifts.sort((lhs, rhs) => {
                if (schedule.config.sortPastEventsLast && lhs.finished !== rhs.finished)
                    return lhs.finished ? 1 : -1;

                return lhs.startTime - rhs.startTime;
            });

            let finished: boolean = false;
            if (shifts.length > 0) {
                finished = toZonedDateTime(shifts[0].startTime).with({
                    hour: 23,
                    minute: 59,
                    second: 59,
                }).epochSeconds < currentTime;
            }

            scheduledShifts.push({
                label,
                divider: false,
                finished,
                shifts,
            });
        }

        scheduledShifts.sort((lhs, rhs) => {
            if (schedule.config.sortPastDaysLast && lhs.finished !== rhs.finished)
                return lhs.finished ? 1 : -1;

            return lhs.shifts[0].startTime - rhs.shifts[0].startTime;
        });

        for (let index = 1; index < scheduledShifts.length; ++index) {
            if (scheduledShifts[index].finished === scheduledShifts[0].finished)
                continue;

            scheduledShifts[index].divider = true;
            break;
        }

        return scheduledShifts;

    }, [ props.userId, schedule ]);

    // ---------------------------------------------------------------------------------------------
    // Avatar management:
    // ---------------------------------------------------------------------------------------------

    // Volunteers are able to edit their own avatar by default, and can be granted a privilege that
    // will allow them to edit anyone's avatar. That privilege is conveyed as a config option.
    const avatarEditable =
        schedule?.config.enableAvatarManagement || props.userId === `${schedule?.userId}`;

    // Called when a new avatar has been selected that hsould be uploaded to the server.
    const handleAvatarChange = useCallback(async (avatar: Blob) => {
        try {
            const base64Header = 'data:image/png;base64,';
            const base64Avatar = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onloadend =
                    () => resolve((reader.result as string).substring(base64Header.length));
                reader.readAsDataURL(avatar);
            });

            const response = await callApi('post', '/api/auth/update-avatar', {
                avatar: base64Avatar as string,
                overrideUserId: parseInt(props.userId, /* radix= */ 10),
            });

            if (response.success) {
                refresh?.();
                router.refresh();
            }

            return response.success;

        } catch (error) {
            console.error('Unable to upload a new avatar:', error);
        }

        return false;

    }, [ props.userId, refresh, router ]);

    // ---------------------------------------------------------------------------------------------
    // Notes management:
    // ---------------------------------------------------------------------------------------------

    const [ noteEditorOpen, setNoteEditorOpen ] = useState<boolean>(false);

    const handleCloseNotes = useCallback(() => setNoteEditorOpen(false), [ /* no deps */ ]);
    const handleOpenNotes = useCallback(() => setNoteEditorOpen(true), [ /* no deps */ ]);

    const handleSubmitNotes = useCallback(async (notes: string) => {
        if (!schedule)
            return false;  // unable to update notes when the event is not known

        const response = await callApi('put', '/api/event/schedule/notes', {
            event: schedule.slug,
            userId: parseInt(props.userId, /* radix= */ 10),
            notes,
        });

        if (!!response.success) {
            refresh?.();
            router.refresh();
        }

        return response.success;

    }, [ props.userId, refresh, router, schedule ]);

    // ---------------------------------------------------------------------------------------------

    if (!schedule || !schedule.volunteers.hasOwnProperty(props.userId)) {
        return (
            <ErrorCard title="This volunteer cannot be found!">
                The volunteer you tried to access does not participate in this event.
            </ErrorCard>
        );
    }

    const volunteer = schedule.volunteers[props.userId];

    let phoneNumber: string | undefined;
    let whatsAppNumber: string | undefined;

    if (!!volunteer.phoneNumber) {
        phoneNumber = `tel:${volunteer.phoneNumber}`;
        whatsAppNumber = `https://wa.me/${volunteer.phoneNumber.replace(/^\+/, '')}`;
    }

    return (
        <>
            <SetTitle title={volunteer.name} />
            <Card>
                <CardHeader title={volunteer.name}
                            titleTypographyProps={{ variant: 'subtitle2' }}
                            subheader={volunteer.role}
                            sx={{ '& .MuiCardHeader-action': { alignSelf: 'center' } }}
                            action={
                                <Stack direction="row" spacing={1} sx={{ pr: 1 }}>
                                    { !!schedule.config.enableNotesEditor &&
                                        <Tooltip title="Edit their notes">
                                            <IconButton onClick={handleOpenNotes}>
                                                <EditNoteIcon color="primary" />
                                            </IconButton>
                                        </Tooltip> }
                                    { !!phoneNumber &&
                                        <Tooltip title="Give them a call">
                                            <IconButton LinkComponent={Link} href={phoneNumber}>
                                                <PhoneIcon color="primary" />
                                            </IconButton>
                                        </Tooltip> }
                                    { !!whatsAppNumber &&
                                        <Tooltip title="Send them a WhatsApp message">
                                            <IconButton LinkComponent={Link} href={whatsAppNumber}
                                                        target="_blank">
                                                <WhatsAppIcon color="primary" />
                                            </IconButton>
                                        </Tooltip> }
                                </Stack>
                            }
                            avatar={
                                <Avatar editable={avatarEditable} src={volunteer.avatar}
                                        onChange={handleAvatarChange}>
                                    {volunteer.name}
                                </Avatar>
                            } />
            </Card>
            { !!volunteer.notes &&
                <NotesCard icon={ <NotesIcon color="primary" /> }
                           title="Notes"
                           notes={volunteer.notes} /> }
            { !scheduledShifts.length &&
                <ErrorCard title="No scheduled shifts">
                    This volunteer has not been assigned to any shifts.
                </ErrorCard> }
            { scheduledShifts.map(section =>
                <React.Fragment key={section.label}>
                    <SubHeader>{section.label}</SubHeader>
                    <Card sx={{ mt: '8px !important' }}>
                        <List dense disablePadding>
                            {section.shifts.map(shift => {
                                const href = `/schedule/${schedule.slug}/events/${shift.activity}`;
                                return (
                                    <ListItemButton LinkComponent={Link} href={href} key={shift.id}
                                                    sx={shift.sx}>
                                        <ListItemText primary={shift.name} />
                                        <ListItemDetails>
                                            {shift.start}–{shift.end}
                                        </ListItemDetails>
                                    </ListItemButton>
                                );
                            } )}
                        </List>
                    </Card>
                </React.Fragment> )}
            { !!schedule.config.enableNotesEditor &&
                <NotesEditorDialog onClose={handleCloseNotes} onSubmit={handleSubmitNotes}
                                   notes={volunteer.notes} open={noteEditorOpen} /> }
        </>
    );
}

// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCallback, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import EditNoteIcon from '@mui/icons-material/EditNote';
import IconButton from '@mui/material/IconButton';
import NotesIcon from '@mui/icons-material/Notes';
import PhoneIcon from '@mui/icons-material/Phone';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import { Avatar } from '@components/Avatar';
import { ErrorCard } from '../../components/ErrorCard';
import { Markdown } from '@components/Markdown';
import { ScheduleContext } from '../../ScheduleContext';
import { SetTitle } from '../../components/SetTitle';
import { callApi } from '@lib/callApi';

const NotesEditorDialog = dynamic(() => import('../../components/NotesEditorDialog'), {
    ssr: false,
});

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
                <Card sx={{ p: 2 }}>
                    <Stack direction="row" spacing={2}>
                        <Box sx={{ height: '1em', minWidth: '40px', textAlign: 'center' }}>
                            <NotesIcon color="primary" />
                        </Box>
                        <Markdown>{volunteer.notes}</Markdown>
                    </Stack>
                </Card> }
            { !volunteer.schedule.length &&
                <ErrorCard title="No scheduled shifts">
                    This volunteer has not been assigned to any shifts.
                </ErrorCard> }
            { /* TODO: Schedule */ }
            { !!schedule.config.enableNotesEditor &&
                <NotesEditorDialog onClose={handleCloseNotes} onSubmit={handleSubmitNotes}
                                   notes={volunteer.notes} open={noteEditorOpen} /> }
        </>
    );
}

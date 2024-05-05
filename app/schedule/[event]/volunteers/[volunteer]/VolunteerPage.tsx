// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useContext } from 'react';
import { useRouter } from 'next/navigation';

import AlertTitle from '@mui/material/AlertTitle';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';

import { Alert } from '../../components/Alert';
import { Avatar } from '@app/components/Avatar';
import { ScheduleContext } from '../../ScheduleContext';
import { SetTitle } from '../../components/SetTitle';
import { callApi } from '@lib/callApi';

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
    // TODO

    // ---------------------------------------------------------------------------------------------

    if (!schedule || !schedule.volunteers.hasOwnProperty(props.userId)) {
        return (
            <Alert elevation={1} severity="error">
                <AlertTitle>This volunteer cannot be found!</AlertTitle>
                The area you've tried to access does not exist.
            </Alert>
        );
    }

    const volunteer = schedule.volunteers[props.userId];

    return (
        <>
            <SetTitle title={volunteer.name} />
            <Card>
                <CardHeader title={volunteer.name}
                            titleTypographyProps={{ variant: 'subtitle2' }}
                            subheader={volunteer.role}
                            avatar={
                                <Avatar editable={avatarEditable} src={volunteer.avatar}
                                        onChange={handleAvatarChange}>
                                    {volunteer.name}
                                </Avatar>
                            } />
            </Card>
            { /* TODO: Contact information */ }
            { /* TODO: Notes */ }
            { /* TODO: Schedule */ }
        </>
    );
}

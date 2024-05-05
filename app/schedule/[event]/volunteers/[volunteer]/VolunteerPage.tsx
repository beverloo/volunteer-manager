// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useContext } from 'react';

import AlertTitle from '@mui/material/AlertTitle';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';

import { Alert } from '../../components/Alert';
import { ScheduleContext } from '../../ScheduleContext';
import { SetTitle } from '../../components/SetTitle';

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
    const { schedule } = useContext(ScheduleContext);
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
                <CardHeader avatar={ undefined }
                            title={volunteer.name}
                            titleTypographyProps={{ variant: 'subtitle2' }}
                            subheader={volunteer.role} />
            </Card>
            { /* TODO: Avatar (w/ edit functionality) */ }
            { /* TODO: Contact information */ }
            { /* TODO: Notes */ }
            { /* TODO: Schedule */ }
        </>
    );
}

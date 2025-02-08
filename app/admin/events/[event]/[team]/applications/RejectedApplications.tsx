// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { ApplicationInfo } from './Applications';
import { Avatar } from '@components/Avatar';
import { ContrastBox } from '@app/admin/components/ContrastBox';
import { Temporal, formatDate } from '@lib/Temporal';
import { callApi } from '@lib/callApi';

import { kRegistrationStatus } from '@lib/database/Types';

/**
 * Props accepted by the <RejectedApplications> component.
 */
interface RejectedApplicationsProps {
    /**
     * The applications that were rejected.
     */
    applications: ApplicationInfo[];

    /**
     * Whether the rejected volunteers are editable; should it be possible to undo the decision?
     */
    editable?: boolean;

    /**
     * Slug of the event for which rejected applications are being shown.
     */
    event: string;

    /**
     * Slug of the team for which rejected applications are being shown.
     */
    team: string;
}

/**
 * The <RejectedApplications> component succintly displays which applications were previously
 * rejected. Only event administrators can re-instate them, as communications have already gone out
 * to the volunteer.
 */
export function RejectedApplications(props: RejectedApplicationsProps) {
    const { applications, editable, event, team } = props;

    const router = useRouter();

    const [ loading, setLoading ] = useState<boolean>(false);
    const handleSubmit = useCallback(async (userId: number) => {
        setLoading(true);
        try {
            const response = await callApi('put', '/api/application/:event/:team/:userId', {
                event,
                team,
                userId,

                status: {
                    registrationStatus: kRegistrationStatus.Registered,
                },
            });

            if (response.success)
                router.refresh();

        } finally {
            setLoading(false);
        }
    }, [ event, router, team ]);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 1 }}>
                Rejected applications
            </Typography>
            { !editable &&
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Talk to a <strong>Staff</strong>-level volunteer if you believe that we should
                    reconsider any of these applications.
                </Alert> }
            <Stack direction="column" spacing={2}>
                { applications.map((application, index) =>
                    <Stack component={ContrastBox} direction="row" alignItems="center"
                           justifyContent="space-between" key={index} sx={{ p: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center"
                               divider={ <Divider orientation="vertical" flexItem /> }>
                            <Avatar src={application.avatar}>
                                {application.firstName} {application.lastName}
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle1">
                                    {application.firstName} {application.lastName}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'action.active' }}>
                                    { formatDate(
                                        Temporal.ZonedDateTime.from(application.date!),
                                        'dddd, MMMM D, YYYY') }
                                </Typography>
                            </Box>
                        </Stack>
                        { !!editable &&
                            <Button loading={loading} variant="outlined"
                                    onClick={ () => handleSubmit(application.userId) }>
                                Reconsider
                            </Button> }
                    </Stack> )}
            </Stack>
        </Paper>
    )
}

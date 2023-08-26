// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';
import LoadingButton from '@mui/lab/LoadingButton/LoadingButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type { VolunteerContactInfoDefinition } from '@app/api/admin/volunteerContactInfo';
import { issueServerAction } from '@lib/issueServerAction';

/**
 * Props accepted by the <ContactInformation> component.
 */
export interface ContactInformationProps {
    /**
     * ID of the event, team and user for whom this box is being displayed.
     */
    eventId: number;
    teamId: number;
    userId: number;

    /**
     * Contact information prepopulated by the server. Will bypass the access request.
     */
    contactInfo?: {
        username?: string;
        phoneNumber?: string;
    };
}

/**
 * The <ContactInformation> panel displays contact information when it's available, or allows a
 * volunteer to request it when it's not. Access to personal information will be recorded.
 */
export function ContactInformation(props: ContactInformationProps) {
    const { contactInfo, eventId, teamId, userId } = props;

    const [ username, setUsername ] = useState<string | undefined>(contactInfo?.username);
    const [ phoneNumber, setPhoneNumber ] = useState<string | undefined>(contactInfo?.phoneNumber);

    const [ loading, setLoading ] = useState<boolean>(false);

    const handleReveal = useCallback(async () => {
        setLoading(true);
        try {
            const response = await issueServerAction<VolunteerContactInfoDefinition>(
                '/api/admin/volunteer-contact-info', { eventId, teamId, userId });

            setUsername(response.username);
            setPhoneNumber(response.phoneNumber);
        } catch (error: any) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [ eventId, teamId, userId ]);

    const visible = !!username || !!phoneNumber;
    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 1 }}>
                Contact information
            </Typography>
            <Collapse in={!visible}>
                <Alert severity="warning" icon={false} sx={{ '&>div': { p: 0 } }}>
                    <LoadingButton loading={loading} startIcon={ <AdminPanelSettingsIcon /> }
                                   onClick={handleReveal}>
                        Reveal contact information
                    </LoadingButton>
                </Alert>
            </Collapse>
            <Collapse in={visible}>
                <Grid container spacing={2} sx={{ pt: 1 }}>
                    <Grid xs={6}>
                        <TextField name="username" label="E-mail address" fullWidth size="small"
                                   value={`${username}`} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid xs={6}>
                        <TextField name="phoneNumber" label="Phone number" fullWidth size="small"
                                   value={`${phoneNumber}`} InputProps={{ readOnly: true }} />
                    </Grid>
                </Grid>
            </Collapse>
        </Paper>
    );
}

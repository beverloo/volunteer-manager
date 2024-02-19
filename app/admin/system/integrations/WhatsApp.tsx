// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import { type FieldValues, FormContainer, TextFieldElement } from 'react-hook-form-mui';

import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { WhatsAppSettings } from '@lib/integrations/whatsapp/WhatsAppClient';
import { SubmitCollapse } from '../../components/SubmitCollapse';
import { callApi } from '@lib/callApi';

/**
 * Props accepted by the <WhatsApp> component.
 */
export interface WhatsAppProps {
    /**
     * The settings for which this integration should be displayed.
     */
    settings: WhatsAppSettings;
}

/**
 * The <WhatsApp> component allows administrators to change the settings through which we interact
 * with the WhatsApp For Business API. Changes are applied immediately.
 */
export function WhatsApp(props: WhatsAppProps) {
    const { settings } = props;

    const [ error, setError ] = useState<string>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleInvalidate = useCallback(() => setInvalidated(true), [ setInvalidated ]);
    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        setError(undefined);
        try {
            await callApi('post', '/api/admin/update-integration', {
                whatsApp: {
                    accessToken: data.accessToken,
                    phoneNumberId: data.phoneNumberId,
                },
            });
            setInvalidated(false);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ setError, setInvalidated, setLoading ]);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                WhatsApp
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
                The following information is used to communicate information over Meta's WhatsApp
                for Business API. Data can be obtained in the business control panel.
            </Alert>
            <FormContainer defaultValues={settings} onSuccess={handleSubmit}>
                <Grid container spacing={2}>
                    <Grid xs={6}>
                        <TextFieldElement name="accessToken" label="Access token" fullWidth
                                          size="small" onChange={handleInvalidate} />
                    </Grid>
                    <Grid xs={6}>
                        <TextFieldElement name="phoneNumberId" label="Phone number ID" fullWidth
                                          size="small" onChange={handleInvalidate} />
                    </Grid>
                </Grid>
                <SubmitCollapse error={error} loading={loading} open={invalidated} sx={{ mt: 2 }} />
            </FormContainer>
        </Paper>
    );
}

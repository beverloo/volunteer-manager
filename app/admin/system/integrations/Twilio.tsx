// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useMemo, useState } from 'react';

import { type FieldValues, FormContainer, SelectElement, TextFieldElement }
    from '@proxy/react-hook-form-mui';

import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { TwilioSettings } from '@lib/integrations/twilio/TwilioClient';
import { SubmitCollapse } from '../../components/SubmitCollapse';
import { TwilioRegion } from '@lib/integrations/twilio/TwilioTypes';
import { callApi } from '@lib/callApi';

/**
 * Props accepted by the <Twilio> component.
 */
export interface TwilioProps {
    /**
     * The settings for which this integration should be displayed.
     */
    settings: TwilioSettings;
}

/**
 * The <Twilio> component allows administrators to change the settings through which we interact
 * with the Twilio API, used for SMS and WhatsApp messaging. Changes are applied immediately.
 */
export function Twilio(props: TwilioProps) {
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
                twilio: {
                    accountAuthToken: data.accountAuthToken,
                    accountSid: data.accountSid,
                    messagingSidSms: data.messagingSidSms,
                    messagingSidWhatsapp: data.messagingSidWhatsapp,
                    region: data.region,
                },
            });
            setInvalidated(false);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ setError, setInvalidated, setLoading ]);

    const regions = useMemo(() => {
        return Object.values(TwilioRegion).map(region => ({
            id: region,
            label: region,
        }));
    }, [ /* no dependencies */ ]);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                Twilio
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
                Twilio is used to send SMS and WhatsApp messages to select volunteers.
            </Alert>
            <FormContainer defaultValues={settings} onSuccess={handleSubmit}>
                <Grid container spacing={2}>
                    <Grid xs={6}>
                        <TextFieldElement name="accountSid" label="Account SID" fullWidth
                                          size="small" onChange={handleInvalidate} />
                    </Grid>
                    <Grid xs={6}>
                        <TextFieldElement name="accountAuthToken" label="Auth token" fullWidth
                                          size="small" onChange={handleInvalidate} />
                    </Grid>
                    <Grid xs={6}>
                        <TextFieldElement name="messagingSidSms" label="SMS SID" fullWidth
                                          size="small" onChange={handleInvalidate} />
                    </Grid>
                    <Grid xs={6}>
                        <TextFieldElement name="messagingSidWhatsapp" label="WhatsApp SID" fullWidth
                                          size="small" onChange={handleInvalidate} />
                    </Grid>
                    <Grid xs={12}>
                        <SelectElement name="region" label="Twilio region" fullWidth size="small"
                                       options={regions} onChange={handleInvalidate} />
                    </Grid>
                </Grid>
                <SubmitCollapse error={error} loading={loading} open={invalidated} sx={{ mt: 2 }} />
            </FormContainer>
        </Paper>
    );
}

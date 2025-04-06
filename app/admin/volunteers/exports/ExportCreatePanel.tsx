// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { FieldValues } from '@proxy/react-hook-form-mui';
import { FormContainer, SelectElement, TextFieldElement } from '@proxy/react-hook-form-mui';

import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { Temporal } from '@lib/Temporal';
import { callApi } from '@lib/callApi';

/**
 * Options that can be selected for the availability of the export.
 */
const kAvailabilityOptions = [
    { id: 1, label: '1 hour' },
    { id: 8, label: '8 hours' },
    { id: 24, label: '1 day' },
    { id: 24 * 7, label: '1 week' },
    { id: 24 * 7 * 2, label: '2 weeks' },
];

/**
 * Options that can be selected for the type of data that should be exported.
 */
const kTypeOptions = [
    { id: 'Credits', label: 'Credit reel consent' },
    { id: 'Refunds', label: 'Refund requests' },
    { id: 'Trainings', label: 'Training participation' },
    { id: 'Volunteers', label: 'Volunteer list' },
    { id: 'WhatsApp', label: 'WhatsApp contact details' },
];

/**
 * Options that can be selected for the maximum number of views of an export.
 */
const kViewsOptions = [
    { id: 1, label: '1 view' },
    { id: 5, label: '5 views' },
    { id: 10, label: '10 views' },
    { id: 25, label: '25 views' },
];

/**
 * Props accepted by the <ExportCreatePanel> component.
 */
interface ExportCreatePanelProps {
    /**
     * Events for which data exports can currently be created.
     */
    events: { id: string; label: string }[];
}

/**
 * The <ExportCreatePanel> component creates the ability to publish data under predefined conditions
 * by one of the export administrators.
 */
export function ExportCreatePanel(props: ExportCreatePanelProps) {
    const router = useRouter();

    const [ error, setError ] = useState<string | undefined>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleInvalidate = useCallback(() => setInvalidated(true), [ /* no deps */ ]);
    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        try {
            const hours = parseInt(data.hours, /* radix= */ 10);
            if (hours < 1 || hours > 350)
                throw new Error(`The given expiration date not valid (${hours} hours)`);

            const response = await callApi('post', '/api/admin/exports', {
                row: {
                    event: data.event,
                    type: data.type,
                    justification: data.justification,
                    expirationDate: Temporal.Now.zonedDateTimeISO('UTC').add({ hours }).toString(),
                    expirationViews: data.views,
                },
            });

            if (response.success)
                router.push(`./exports/${response.row.id}`);
            else
                setError(response.error ?? 'The export cannot be created right now');
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ router ]);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 1 }}>
                Export data
            </Typography>
            <FormContainer onSuccess={handleSubmit}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                        <SelectElement name="event" fullWidth size="small" required label="Event"
                                       onChange={handleInvalidate} options={props.events} />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <SelectElement name="type" fullWidth size="small" required label="Data"
                                       onChange={handleInvalidate} options={kTypeOptions} />
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                        <SelectElement name="hours" fullWidth size="small" required
                                       label="Availability" onChange={handleInvalidate}
                                       options={kAvailabilityOptions} />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <SelectElement name="views" fullWidth size="small" required
                                       label="Maximum views" onChange={handleInvalidate}
                                       options={kViewsOptions} />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextFieldElement name="justification" fullWidth size="small" required
                                          label="Justification" onChange={handleInvalidate} />
                    </Grid>
                </Grid>
                <SubmitCollapse error={error} loading={loading} open={invalidated} sx={{ mt: 2 }} />
            </FormContainer>
        </Paper>
    );
}

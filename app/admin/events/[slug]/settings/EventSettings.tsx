// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { type FieldValues, DateTimePickerElement, FormContainer, TextFieldElement }
    from 'react-hook-form-mui';

import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import type { UpdateEventDefinition } from '@app/api/admin/updateEvent';
import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { issueServerAction } from '@lib/issueServerAction';
import { dayjs } from '@lib/DateTime';

/**
 * Props accepted by the <EventSettings> component.
 */
export interface EventSettingsProps {
    /**
     * Information about the event whose settings are being changed.
     */
    event: PageInfo['event'];
}

/**
 * The <EventSettings> component allows the administrator to change settings about the event itself,
 * such as its name, slug and dates over which it will take.
 */
export function EventSettings(props: EventSettingsProps) {
    const { event } = props;

    const [ error, setError ] = useState<string | undefined>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const router = useRouter();

    const handleChange = useCallback(() => setInvalidated(true), [ setInvalidated ]);
    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        try {
            const response = await issueServerAction<UpdateEventDefinition>(
                '/api/admin/update-event',
                {
                    event: event.slug,
                    eventSettings: {
                        name: data.name,
                        shortName: data.shortName,
                        startTime: dayjs(data.startTime).toISOString(),
                        endTime: dayjs(data.endTime).toISOString(),
                    },
                });

            if (response.success) {
                setInvalidated(false);
                router.refresh();
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ event, router ]);

    const defaultValues = {
        ...event,
        startTime: dayjs(event.startTime),
        endTime: dayjs(event.endTime),
    }

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 2 }}>
                Event settings
            </Typography>
            <FormContainer defaultValues={defaultValues} onSuccess={handleSubmit}>
                <Grid container spacing={2}>
                    <Grid xs={12}>
                        <TextFieldElement name="name" label="Full event name" required fullWidth
                                          size="small" onChange={handleChange} />
                    </Grid>

                    <Grid xs={6}>
                        <TextFieldElement name="shortName" label="Full short name" required
                                          fullWidth size="small" onChange={handleChange} />
                    </Grid>
                    <Grid xs={6}>
                        <TextFieldElement name="slug" label="Event slug" required fullWidth
                                          size="small" InputProps={{ readOnly: true }} />
                    </Grid>

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Grid xs={6}>
                            <DateTimePickerElement name="startTime" label="Start time" required
                                                   inputProps={{ fullWidth: true, size: 'small' }}
                                                   onChange={handleChange} textReadOnly />
                        </Grid>
                        <Grid xs={6}>
                            <DateTimePickerElement name="endTime" label="End time" required
                                                   inputProps={{ fullWidth: true, size: 'small' }}
                                                   onChange={handleChange} textReadOnly />
                        </Grid>
                    </LocalizationProvider>
                </Grid>
                <SubmitCollapse error={error} loading={loading} open={invalidated} sx={{ mt: 2 }}/>
            </FormContainer>
        </Paper>
    );
}

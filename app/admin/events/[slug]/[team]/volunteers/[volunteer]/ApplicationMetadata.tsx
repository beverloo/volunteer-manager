// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { type FieldValues, DateTimePickerElement, FormContainer, SelectElement }
    from 'react-hook-form-mui';

import Grid from '@mui/material/Unstable_Grid2';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { callApi } from '@lib/callApi';
import { dayjs } from '@lib/DateTime';

/**
 * Options for a binary select box. They look better on the page than checkboxes.
 */
const kSelectOptions = [
    { id: 2, label: '(default)' },
    { id: 1, label: 'Eligible' },
    { id: 0, label: 'Not eligible' },
];

/**
 * Props accepted by the <ApplicationMetadata> component.
 */
export interface ApplicationMetadataProps {
    /**
     * Slug of the event for which application metadata is being shown.
     */
    event: string;

    /**
     * Slug of the team that this application is part of.
     */
    team: string;

    /**
     * Information about the volunteer for whom this panel is being shown.
     */
    volunteer: {
        /**
         * Unique ID of the account owned by this volunteer.
         */
        userId: number;

        /**
         * The date on which this volunteer created their application. May be NULL.
         */
        registrationDate?: Date;

        /**
         * Whether this volunteer is eligible for a hotel room beyond conventional rules.
         */
        hotelEligible?: number;

        /**
         * Whether this volunteer is eligible to join the training beyond conventional rules.
         */
        trainingEligible?: number;
    };
}

/**
 * The <ApplicationMetadata> panel displays metadata about the application and provides certain
 * volunteers with the ability to override team-wide configuration, such as the volunteer's
 * ability to participate in trainings and/or hotel room eligibility.
 */
export function ApplicationMetadata(props: ApplicationMetadataProps) {
    const { event, team, volunteer } = props;

    const router = useRouter();

    const [ error, setError ] = useState<string | undefined>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleChange = useCallback(() => setInvalidated(true), [ /* no deps */ ]);
    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        setError(undefined);
        try {
            const response = await callApi('put', '/api/application/:event/:team/:userId', {
                event,
                team,
                userId: volunteer.userId,

                metadata: {
                    registrationDate:
                        data.registrationDate ? data.registrationDate.toISOString()
                                              : undefined,
                    hotelEligible:
                        [ 0, 1 ].includes(data.hotelEligible) ? data.hotelEligible : undefined,
                    trainingEligible:
                        [ 0, 1 ].includes(data.trainingEligible) ? data.trainingEligible
                                                                 : undefined,
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
    }, [ event, router, team, volunteer.userId ]);

    const defaultValues = useMemo(() => ({
        hotelEligible: volunteer.hotelEligible,
        trainingEligible: volunteer.trainingEligible,
        registrationDate: volunteer.registrationDate ? dayjs(volunteer.registrationDate) : null
    }), [ volunteer.registrationDate, volunteer.hotelEligible, volunteer.trainingEligible ]);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 1 }}>
                Application information
                <Tooltip title="Restricted to the application override permission">
                    <LockOpenIcon color="warning" fontSize="small"
                                  sx={{ verticalAlign: 'middle', mb: 0.25, ml: 1 }} />
                </Tooltip>
            </Typography>
            <FormContainer defaultValues={defaultValues} onSuccess={handleSubmit}>
                <Grid container spacing={2} sx={{ pt: 1 }}>
                    <Grid xs={12}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DateTimePickerElement name="registrationDate" label="Registration date"
                                                   inputProps={{ fullWidth: true, size: 'small' }}
                                                   onChange={handleChange} />
                        </LocalizationProvider>
                    </Grid>

                    <Grid xs={6}>
                        <SelectElement name="hotelEligible" label="Hotel eligibility override"
                                       options={kSelectOptions} fullWidth size="small"
                                       onChange={handleChange} />
                    </Grid>
                    <Grid xs={6}>
                        <SelectElement name="trainingEligible" label="Training eligibility override"
                                       options={kSelectOptions} fullWidth size="small"
                                       onChange={handleChange} />
                    </Grid>
                </Grid>
                <SubmitCollapse error={error} open={invalidated} loading={loading} sx={{ mt: 2 }} />
            </FormContainer>
        </Paper>
    );
}

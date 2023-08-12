// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { type FieldValues, DatePickerElement, FormContainer, SelectElement, TextFieldElement }
    from 'react-hook-form-mui';

import type { SxProps, Theme } from '@mui/system';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { red } from '@mui/material/colors';

import type { VolunteerInfo } from './page';
import { dayjs } from '@lib/DateTime';
import { kGenderOptions } from '@app/registration/authentication/RegisterDialog';

/**
 * Custom styles applied to the <Information> component.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    unsavedWarning: {
        backgroundColor: theme => theme.palette.mode === 'light' ? red[50] : red[900],
        borderRadius: 1,
        padding: 1,
    },
};

/**
 * Props accepted by the <Information> component.
 */
export interface InformationProps {
    /**
     * The account of the volunteer for whom this page container.
     */
    account: VolunteerInfo['account'];
}

/**
 * The <Information> component lists the volunteer's basic information, which may be amended by the
 * person who has access to this page. Amendments are made using an API call.
 */
export function Information(props: InformationProps) {
    const { account } = props;

    const [ invalidated, setInvalidated ] = useState(false);
    const [ loading, setLoading ] = useState(false);

    const router = useRouter();

    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setLoading(false);
        setInvalidated(false);
    }, [ account, router ]);

    const defaultValues = { ...account, rawBirthdate: dayjs(account.birthdate) };
    return (
        <FormContainer defaultValues={defaultValues} onSuccess={handleSubmit}>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ pb: 2 }}>
                    Information
                </Typography>
                <Grid container spacing={2}>
                    <Grid xs={6}>
                        <TextFieldElement name="firstName" label="First name" type="text"
                                          fullWidth size="small" required
                                          onChange={ () => setInvalidated(true) } />
                    </Grid>
                    <Grid xs={6}>
                        <TextFieldElement name="lastName" label="Last name" type="text"
                                          fullWidth size="small" required
                                          onChange={ () => setInvalidated(true) } />
                    </Grid>

                    <Grid xs={6}>
                        <TextFieldElement name="username" label="E-mail address" type="email"
                                          fullWidth size="small"
                                          onChange={ () => setInvalidated(true) } />
                    </Grid>
                    <Grid xs={6}>
                        <SelectElement name="gender" label="Gender" options={kGenderOptions}
                                       fullWidth size="small" required
                                       onChange={ () => setInvalidated(true) } />
                    </Grid>

                    <Grid xs={6}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePickerElement name="rawBirthdate" label="Date of birth"
                                               disableFuture disableHighlightToday openTo="year"
                                               inputProps={{ fullWidth: true, size: 'small' }}
                                               onChange={ () => setInvalidated(true) } />
                        </LocalizationProvider>
                    </Grid>
                    <Grid xs={6}>
                        <TextFieldElement name="phoneNumber" label="Phone number" type="tel"
                                          fullWidth size="small"
                                          onChange={ () => setInvalidated(true) } />
                    </Grid>

                    <Grid xs={12}>
                        <Collapse in={invalidated}>
                            <Box sx={kStyles.unsavedWarning}>
                                <LoadingButton loading={loading} variant="contained" type="submit">
                                    Save changes
                                </LoadingButton>
                            </Box>
                        </Collapse>
                    </Grid>
                </Grid>
            </Paper>
        </FormContainer>
    );
}

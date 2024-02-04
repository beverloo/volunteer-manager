// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { type FieldValues, DatePickerElement, FormContainer, SelectElement, TextFieldElement }
    from 'react-hook-form-mui';

import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { VolunteerInfo } from './page';
import { SubmitCollapse } from '../../components/SubmitCollapse';
import { Temporal, formatDate } from '@lib/Temporal';
import { callApi } from '@lib/callApi';
import { dayjs } from '@lib/DateTime';

import { kGenderOptions } from '@app/registration/authentication/RegisterForm';

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

    const [ error, setError ] = useState<string>();
    const [ loading, setLoading ] = useState(false);

    const router = useRouter();

    const handleSubmit = useCallback(async (data: FieldValues) => {
        setError(undefined);
        setLoading(true);

        try {
            const birthdate = dayjs(data.rawBirthdate);
            const response = await callApi('post', '/api/admin/update-volunteer', {
                userId: account.userId,
                firstName: data.firstName,
                lastName: data.lastName,
                username: data.username ?? undefined,
                gender: data.gender,
                birthdate: birthdate.isValid() ? birthdate.format('YYYY-MM-DD') : undefined,
                phoneNumber: data.phoneNumber ?? undefined,
            });

            if (response.success) {
                setInvalidated(false);
                router.refresh();
            } else if (response.error) {
                setError(response.error);
            }
        } finally {
            setLoading(false);
        }
    }, [ account, router ]);

    const defaultValues = {
        ...account,
        rawBirthdate: account.birthdate ? dayjs(account.birthdate) : undefined
    };

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
                        <DatePickerElement name="rawBirthdate" label="Date of birth"
                                           disableFuture disableHighlightToday openTo="year"
                                           inputProps={{ fullWidth: true, size: 'small' }}
                                           onChange={ () => setInvalidated(true) } />
                    </Grid>
                    <Grid xs={6}>
                        <TextFieldElement name="phoneNumber" label="Phone number" type="tel"
                                          fullWidth size="small"
                                          onChange={ () => setInvalidated(true) } />
                    </Grid>

                    <Grid xs={12}>
                        <SubmitCollapse error={error} loading={loading} open={invalidated} />
                    </Grid>
                </Grid>
            </Paper>
        </FormContainer>
    );
}

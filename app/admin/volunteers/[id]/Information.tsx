// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { DatePickerElement } from 'react-hook-form-mui/date-pickers';
import { type FieldValues, FormContainer, SelectElement, TextFieldElement }
    from '@proxy/react-hook-form-mui';

import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type { VolunteerInfo } from './page';
import { DiscordIcon } from '../DiscordIcon';
import { SubmitCollapse } from '../../components/SubmitCollapse';
import { callApi } from '@lib/callApi';
import { dayjs } from '@lib/DateTime';

import { kGenderOptions } from '@app/registration/authentication/RegisterForm';

/**
 * Props accepted by the <Information> component.
 */
interface InformationProps {
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
                displayName: data.displayName ?? undefined,
                username: data.username ?? undefined,
                gender: data.gender,
                birthdate: birthdate.isValid() ? birthdate.format('YYYY-MM-DD') : undefined,
                phoneNumber: data.phoneNumber ?? undefined,
                discordHandle: data.discordHandle,
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

    const handleVerifyDiscord = useCallback(() => {
        /* todo */

    }, [ account ]);

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
                    <Grid size={{ xs: 6, md: 3 }}>
                        <TextFieldElement name="firstName" label="First name" type="text"
                                          fullWidth size="small" required
                                          onChange={ () => setInvalidated(true) } />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                        <TextFieldElement name="lastName" label="Last name" type="text"
                                          fullWidth size="small" required
                                          onChange={ () => setInvalidated(true) } />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextFieldElement name="displayName" label="Display name" type="text"
                                          fullWidth size="small"
                                          onChange={ () => setInvalidated(true) } />
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                        <DatePickerElement name="rawBirthdate" label="Date of birth"
                                           disableFuture disableHighlightToday openTo="year"
                                           inputProps={{ fullWidth: true, size: 'small' }}
                                           onChange={ () => setInvalidated(true) } />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <SelectElement name="gender" label="Gender" options={kGenderOptions}
                                       fullWidth size="small" required
                                       onChange={ () => setInvalidated(true) } />
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                        <TextFieldElement name="username" label="E-mail address" type="email"
                                          fullWidth size="small"
                                          onChange={ () => setInvalidated(true) } />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <TextFieldElement name="phoneNumber" label="Phone number" type="tel"
                                          fullWidth size="small"
                                          onChange={ () => setInvalidated(true) } />
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                        <Stack direction="row" spacing={1}>
                            <TextFieldElement name="discordHandle" label="Discord handle"
                                              fullWidth size="small"
                                              onChange={ () => setInvalidated(true) } />
                            { !!account.discordHandleUpdated &&
                                <Tooltip title="Mark their handle as verified">
                                    <IconButton onClick={handleVerifyDiscord}>
                                        <DiscordIcon htmlColor="#5865F2" />
                                    </IconButton>
                                </Tooltip> }
                            { !account.discordHandleUpdated &&
                                <Tooltip title="Their handle has been verified">
                                    <IconButton disabled>
                                        <DiscordIcon color="disabled" />
                                    </IconButton>
                                </Tooltip> }
                        </Stack>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        { /* available */ }
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <SubmitCollapse error={error} loading={loading} open={invalidated} />
                    </Grid>
                </Grid>
            </Paper>
        </FormContainer>
    );
}

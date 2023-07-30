// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useContext, useState } from 'react';
import { redirect, useRouter } from 'next/navigation';

import {
    type FieldValues, CheckboxElement, FormContainer, SelectElement,
    TextFieldElement } from 'react-hook-form-mui';

import type { SxProps, Theme } from '@mui/system';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import FaceIcon from '@mui/icons-material/Face';
import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';
import MuiAvatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { lighten } from '@mui/system/colorManipulator';

import { type ApplicationDefinition } from '@app/api/event/application';
import { type Content } from '@lib/Content';
import { type EventData } from '@lib/Event';
import { type UserData } from '@app/lib/auth/UserData';
import { AuthenticationContext } from '../AuthenticationContext';
import { Avatar } from '@components/Avatar';
import { Markdown } from '@components/Markdown';
import { issueServerAction } from '@lib/issueServerAction';

type ApplicationRequest = ApplicationDefinition['request'];

/**
 * Valid options for the number of hours volunteers are willing to work. When updating an ID, make
 * sure that `kDefaultValues` is updated as well.
 */
const kServiceHoursOptions: { id: ApplicationRequest['serviceHours'], label: string }[] = [
    { id: '12', label: 'Up to 12 hours' },
    { id: '16', label: '12–16 hours' },
    { id: '20', label: '16–20 hours' },
    { id: '24', label: 'More than 20 hours' },
];

/**
 * Valid options for the timing of shifts a volunteer could be issued. When updating an ID, make
 * sure that `kDefaultValues` is updated as well.
 */
const kServiceTimingOption: { id: ApplicationRequest['serviceTiming'], label: string }[] = [
    { id: '8-20', label: 'Early (08:00–20:00)' },
    { id: '10-0', label: 'Regular (10:00–00:00)' },
    { id: '14-3', label: 'Late (14:00–03:00)' },
];

/**
 * Valid options for the t-shirt fit select field.
 */
const kTShirtFitOptions: { id: ApplicationRequest['tshirtFit'], label: string }[] = [
    { id: 'Regular', label: 'Regular' },
    { id: 'Girly', label: 'Girly' },
];

/**
 * Valid options for the t-shirt size select field.
 */
const kTShirtSizeOptions: { id: ApplicationRequest['tshirtSize'], label: string }[] = [
    { id: 'XS', label: 'XS' },
    { id: 'S', label: 'Small' },
    { id: 'M', label: 'Medium' },
    { id: 'L', label: 'Large' },
    { id: 'XL', label: 'XL' },
    { id: 'XXL', label: 'XXL' },
    { id: '3XL', label: '3XL' },
    { id: '4XL', label: '4XL' },
];

/**
 * Default values we pre-fill for incoming applications. The vast majority of volunteers choose
 * these options anyway, and this allows more emphasis on adjusted values.
 */
const kDefaultValues = {
    serviceHours: '16',
    serviceTiming: '10-0',
};

/**
 * Manual styles that apply to the <ApplicationPage> client component.
 */
export const kStyles: { [key: string]: SxProps<Theme> } = {
    availabilityWarning: {
        borderLeft: (theme) => `3px solid ${theme.palette.error.main}`,
        marginLeft: 3.5,
        paddingLeft: 2,
    },
    identity: {
        paddingBottom: 2,
        '& > .MuiBox-root': {
            width: 'fit-content',
            cursor: 'pointer',
            borderRadius: 1,
            padding: 1,
            paddingRight: 2,
            transition: 'background-color 0.3s ease-in-out',
        },
    },
    identityKnown: {
        backgroundColor: (theme) => lighten(theme.palette.primary.main, 0.75),
        '&:hover': {
            backgroundColor: (theme) => lighten(theme.palette.primary.main, 0.85),
        },
    },
    identityUnknown: {
        backgroundColor: 'grey.300',
        '&:hover': {
            backgroundColor: 'grey.200',
        },
    },
};

/**
 * Props accepted by the <ApplicationPage> component.
 */
export interface ApplicationPageProps {
    /**
     * The content that should be displayed on the registration page.
     */
    content?: Content;

    /**
     * The event for which data is being displayed on this page.
     */
    event: EventData;

    /**
     * The user who is currently signed in. We require someone to be signed in when applying, as
     * it helps carry their participation information across multiple events.
     */
    user?: UserData;
}

/**
 * The <ApplicationPage> component makes it possible for people to apply to join a particular event.
 * A whole bunch of checks will have to be done in order to verify that they can.
 *
 * @note A development-mode refresh issue is happening right now, which seems to be related to the
 *       latest version of NextJS. See https://zenn.dev/hayato94087/articles/41ab9455bac4b8.
 */
export function ApplicationPage(props: ApplicationPageProps) {
    const { event, user } = props;

    const authenticationContext = useContext(AuthenticationContext);
    const requestAuthenticationFlow = useCallback(() => {
        authenticationContext.requestAuthenticationFlow();
    }, [ authenticationContext ])

    const [ accountError, setAccountError ] = useState<boolean>(false);
    const [ availabilityWarning, setAvailabilityWarning ] = useState<boolean>(false);
    const [ error, setError ] = useState<string>();

    const [ loading, setLoading ] = useState<boolean>(false);
    const router = useRouter();

    const requestRegistration = useCallback(async (data: FieldValues) => {
        if (!user) {
            setAccountError(true);
            return;
        } else {
            setAccountError(false);
        }

        setError(undefined);
        setLoading(true);

        try {
            const response =
                await issueServerAction<ApplicationDefinition>('/api/event/application', {
                    availability: !!data.availability,
                    credits: !!data.credits,
                    event: event.slug,
                    preferences: data.preferences,
                    serviceHours: data.serviceHours,
                    serviceTiming: data.serviceTiming,
                    socials: !!data.socials,
                    tshirtFit: data.tshirtFit,
                    tshirtSize: data.tshirtSize,
                });

            if (!response.success)
                setError(response.error || 'The server was not able to accept your application.');
            else {
                router.refresh();
                redirect(`/registration/${event.slug}/application-received`);
            }

        } catch (error) {
            setError((error as Error).message);
        } finally {
            setLoading(false);
        }

    }, [ event, router, user ]);

    const availabilityLabel = `Yes, I will be fully available during ${event.shortName}`;
    const creditsLabel = `Yes, I'd like to be included in the ${event.shortName} credit reel`;
    const socialsLabel = 'Yes, I would like to join the private Discord and WhatsApp groups';

    return (
        <FormContainer defaultValues={kDefaultValues} onSuccess={requestRegistration}>
            <Box sx={{ p: 2 }}>
                {props.content && <Markdown sx={{ pb: 2 }}>{props.content.markdown}</Markdown> }

                <Typography variant="h6">
                    Personal information
                </Typography>

                <Box sx={kStyles.identity}>
                    { user &&
                        <Box sx={kStyles.identityKnown} onClick={requestAuthenticationFlow}>
                            <Stack alignItems="center" direction="row" spacing={2}>
                                <Avatar src={user.avatarUrl}>
                                    {user.firstName} {user.lastName}
                                </Avatar>
                                <Typography variant="h6">
                                    {user.firstName} {user.lastName}
                                </Typography>
                            </Stack>
                        </Box> }

                    { !user &&
                        <Box sx={kStyles.identityUnknown} onClick={requestAuthenticationFlow}>
                            <Stack alignItems="center" direction="row" spacing={2}>
                                <MuiAvatar>
                                    <FaceIcon />
                                </MuiAvatar>
                                <Typography>
                                    Please sign in or create an account
                                </Typography>
                            </Stack>
                        </Box> }
                </Box>

                <Collapse in={accountError}>
                    <Typography color="error" sx={{ pb: 2 }}>
                        You need to sign in or create an account before applying.
                    </Typography>
                </Collapse>

                <Typography variant="h6">
                    Your participation
                </Typography>
                <Grid container spacing={2} sx={{ pt: 1 }}>
                    <Grid xs={6}>
                        <SelectElement name="tshirtSize" label="T-shirt size" required
                                       options={kTShirtSizeOptions} fullWidth size="small" />
                    </Grid>
                    <Grid xs={6}>
                        <SelectElement name="tshirtFit" label="T-shirt fit" required
                                       options={kTShirtFitOptions} fullWidth size="small" />
                    </Grid>

                    <Grid xs={6}>
                        <SelectElement name="serviceHours" label="Number of shifts" required
                                       options={kServiceHoursOptions} fullWidth size="small" />
                    </Grid>
                    <Grid xs={6}>
                        <SelectElement name="serviceTiming" label="Timing of shifts" required
                                       options={kServiceTimingOption} fullWidth size="small" />
                    </Grid>

                    <Grid xs={12}>
                        <TextFieldElement name="preferences" fullWidth size="small"
                                          label="Any preferences we should know about?" />
                    </Grid>
                </Grid>

                <Typography variant="h6" sx={{ pt: 2 }}>
                    Some more questions…
                </Typography>
                <Stack>
                    <CheckboxElement name="availability" size="small" label={availabilityLabel}
                                     onChange={ (e) => setAvailabilityWarning(e.target.checked) } />

                    <Collapse in={availabilityWarning}>
                        <Typography color="error" sx={kStyles.availabilityWarning}>
                            Please indicate your availability in the preferences field.
                        </Typography>
                    </Collapse>

                    <CheckboxElement name="credits" size="small" label={creditsLabel} />
                    <CheckboxElement name="socials" size="small" label={socialsLabel} />
                </Stack>

                <Collapse in={!!error}>
                    <Typography color="error" sx={{ pt: 2 }}>
                        {error}
                    </Typography>
                </Collapse>

                <LoadingButton loading={loading} type="submit" variant="contained" sx={{ mt: 1 }}>
                    Submit application
                </LoadingButton>

            </Box>
        </FormContainer>
    );
}

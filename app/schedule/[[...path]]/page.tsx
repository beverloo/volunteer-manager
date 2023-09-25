// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { RegistrationContentContainer } from '@app/registration/RegistrationContentContainer';
import { RegistrationLayout } from '@app/registration/RegistrationLayout';
import { determineEnvironment } from '@lib/Environment';
import { getAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * Placeholder for the schedule sub-application, which has not been imported to the new Volunteer
 * Manager yet. For now we display a message to the volunteer that the schedule is not available.
 */
export default async function SchedulePage() {
    const environment = await determineEnvironment();
    if (!environment)
        notFound();

    const { user } = await getAuthenticationContext();

    return (
        <RegistrationLayout environment={environment}>
            <RegistrationContentContainer title="Volunteer Portal" user={user?.toUserData()}>
                <Box sx={{ p: 2 }}>
                    <Typography variant="body1">
                        The Volunteer Portal is not available yet. Please come back closer to the
                        festival to access your schedule.
                    </Typography>
                </Box>
            </RegistrationContentContainer>
        </RegistrationLayout>
    );
}

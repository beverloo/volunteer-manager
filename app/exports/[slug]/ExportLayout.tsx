// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link'

import { default as MuiLink } from '@mui/material/Link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';

import { kLogoContainerStyles } from '@app/registration/RegistrationLayout';

/**
 * The <ExportLayout> is the common layout shared by the exports sub-app. It shows a minimalistic
 * user interface branding our environment, our privacy policy and contact information.
 */
export function ExportLayout(props: React.PropsWithChildren) {
    const year = (new Date()).getFullYear();
    const params = new URLSearchParams([
        [ 'color', /* AnimeCon blue= */ '#06213b' ],
        [ 'title', 'Volunteering Teams' ],
    ]);

    return (
        <Box component={Stack} direction="column" alignItems="center" justifyContent="center"
             sx={{
                 p: 2,
                 minHeight: '100vh',
                 backgroundColor:
                    theme => theme.palette.mode === 'light' ? '#ECEFF1' : '#424242',
             }} spacing={2}>

            <Container component="header" sx={{ textAlign: 'center' }}>
                <Link href="/" style={{ display: 'inline-block' }}>
                    <object type="image/svg+xml" style={kLogoContainerStyles}
                            data={'/images/logo.svg?' + params} />
                </Link>
            </Container>

            {props.children}

            <Paper sx={{ p: 2, width: '75%', textAlign: 'center' }}>
                AnimeCon {year} —{' '}
                <MuiLink component={Link} href="/privacy">
                    Privacy Policy
                </MuiLink> —{' '}
                <MuiLink component={Link} href="mailto:crew@animecon.nl">
                    crew@animecon.nl
                </MuiLink>
            </Paper>

        </Box>
    )
}

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link'
import { useState } from 'react';

import type { SxProps, Theme } from '@mui/system';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { darken } from '@mui/material/styles';

import type { Environment } from '@lib/Environment';
import { AuthenticationContext, AuthenticationContextManager } from './AuthenticationContext';

/**
 * Styles that are to be applied to the <object> element that hosts our logo. This is an SVG file
 * that should by dynamically sized according to the viewport, contained within an <a> element which
 * should be activated when a user clicks on the logo.
 */
const kLogoContainerStyles: React.CSSProperties = {
    cursor: 'pointer',
    pointerEvents: 'none',
    width: '256px',
    maxWidth: '40vw'
};

/**
 * Generates the background styles for the given |environmentName|, which determines the resources
 * that will be used for the background images across both mobile and desktop.
 */
const generateBackgroundStylesForEnvironment = (environmentName: string): SxProps<Theme> => ({
    position: 'fixed',
    zIndex: -1,

    width: '100vw',
    height: '100vh',

    backgroundAttachment: 'fixed',
    backgroundPosition: 'bottom right',
    backgroundSize: 'cover',
    backgroundImage: {
        xs: `url(/images/${environmentName}/background-mobile.jpg?v2)`,
        sm: `url(/images/${environmentName}/background-desktop.jpg?v2)`,
    },
});

/**
 * Props accepted by the <RegistrationLayout> component. Will be called by NextJS.
 */
interface RegistrationLayoutProps {
    /**
     * The children (zero or more) that should be rendered within the layout component.
     */
    children: React.ReactNode;

    /**
     * The environment for which the layout will be displayed. Decides on the layout and graphics
     * that will be used, which can be customised for the different sites.
     */
    environment: Environment;
}

/**
 * The <RegistrationLayout> component represents the main layout used for both the Welcome and the
 * Registration apps, which welcome volunteers and invite them to join our teams.
 */
export function RegistrationLayout(props: RegistrationLayoutProps) {
    const { environment } = props;

    const year = (new Date()).getFullYear();
    const params = new URLSearchParams([
        [ 'color', darken(environment.themeColours.light, .3) ],
        [ 'title', environment.environmentName ],
    ]);

    const [ authenticationContext ] = useState(new AuthenticationContextManager);

    return (
        <>
            <Box sx={generateBackgroundStylesForEnvironment(environment.environmentName)}></Box>
            <Container component="main" sx={{ pb: 2 }}>
                <Container component="header" sx={{ py: 2, textAlign: 'center' }}>
                    <Link href="/" style={{ display: 'inline-block' }}>
                        <object type="image/svg+xml" style={kLogoContainerStyles}
                                data={'/images/logo.svg?' + params} />
                    </Link>
                </Container>
                <AuthenticationContext.Provider value={authenticationContext}>
                    {props.children}
                </AuthenticationContext.Provider>
                <Typography component="footer" align="center" variant="body2" sx={{ mt: 1 }}>
                    AnimeCon Volunteer Portal (<a href="https://github.com/AnimeNL/volunteer-manager">{process.env.buildHash}</a>) — © 2015–{year}
                </Typography>
            </Container>
        </>
    );
}

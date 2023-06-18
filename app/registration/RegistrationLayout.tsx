// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { SxProps, Theme } from '@mui/system';
import Typography from '@mui/material/Typography';
import { darken } from '@mui/material/styles';

import { type Environment, kEnvironmentColours, kEnvironmentTitle } from '../Environment';

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
 * Generates the background styles for the given |environment|, which determines the resources that
 * will be used for the background images across both mobile and desktop.
 */
const generateBackgroundStylesForEnvironment = (environment: Environment): SxProps<Theme> => ({
    position: 'fixed',
    zIndex: -1,

    width: '100vw',
    height: '100vh',

    backgroundAttachment: 'fixed',
    backgroundPosition: 'bottom right',
    backgroundSize: 'cover',
    backgroundImage: {
        xs: `url(/images/${environment}/background-mobile.jpg?v2)`,
        sm: `url(/images/${environment}/background-desktop.jpg?v2)`,
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
    const year = (new Date()).getFullYear();
    const params = new URLSearchParams([
        [ 'color', darken(kEnvironmentColours[props.environment].light, .3) ],
        [ 'title', kEnvironmentTitle[props.environment] ],
    ]);

    return (
        <>
            <Box sx={generateBackgroundStylesForEnvironment(props.environment)}></Box>
            <Container component="main" sx={{ pb: 2 }}>
                <Container component="header" sx={{ py: 2, textAlign: 'center' }}>
                    <a href="/" style={{ display: 'inline-block' }}>
                        <object type="image/svg+xml" style={kLogoContainerStyles}
                                data={'/images/logo.svg?' + params} />
                    </a>
                </Container>
                {props.children}
                <Typography component="footer" align="center" variant="body2" sx={{ mt: 1 }}>
                    AnimeCon Volunteer Portal (<a href="https://github.com/AnimeNL/volunteer-manager">{process.env.buildHash}</a>) — © 2015–{year}
                </Typography>
            </Container>
        </>
    );
}

// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import Box from '@mui/material/Box';

/**
 * Styling rules for the <ScheduleTheme> component & hierarchy.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    container: {
        minHeight: '100vh',
        paddingBottom: {
            xs: 6,  // height of the mobile navigation bar
            md: 1,  // single spacing
        },

        backgroundColor: 'background.default',
        colorScheme: 'light only',
    },
};

/**
 * Creates the theme for the schedule environment.
 */
function createScheduleTheme(darkMode?: boolean) {
    return createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
            background: {
                default: darkMode ? '#212121' : '#F5F5F5',
            },
        },
    });
}

/**
 * The <ScheduleTheme> component modifies the global theme with colours specific to the schedule,
 * which has a slightly different configuration from the registration app.
 */
export function ScheduleTheme(props: React.PropsWithChildren) {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    return (
        <ThemeProvider theme={createScheduleTheme(!!prefersDarkMode)}>
            <Box sx={kStyles.container}>
                {props.children}
            </Box>
        </ThemeProvider>
    );
}

// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { SxProps, Theme } from '@mui/system';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

import Box from '@mui/material/Box';

/**
 * Styling rules for the <DisplayTheme> component & hierarchy.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    container: {
        backgroundColor: 'background.default',
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    },
};

/**
 * Creates the theme for the Display environment.
 */
function createDisplayTheme() {
    return createTheme({
        palette: {
            mode: 'dark',
            background: {
                default: '#211a1a',
                paper: '#362929',
            },
        },
    });
}

/**
 * The <DisplayTheme> component modifies the global theme with colours specific to the Display,
 * which has a static configuration regardless of environment.
 */
export function DisplayTheme(props: React.PropsWithChildren) {
    return (
        <ThemeProvider theme={createDisplayTheme()}>
            <Box sx={kStyles.container}>
                {props.children}
            </Box>
        </ThemeProvider>
    );
}

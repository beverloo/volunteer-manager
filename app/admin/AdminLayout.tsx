// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { SxProps, Theme } from '@mui/system';
import Box from '@mui/material/Box';
import { ThemeProvider } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { createAdminTheme } from './AdminTheme';

/**
 * Custom styles applied to the <AdminLayout> component.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    root: {
        overflow: 'auto',
    },
    container: {
        backgroundColor: 'background.default',
        minHeight: '100vh',
        minWidth: 1280,
        padding: 2,
    },
};

/**
 * Base layout for the Volunteer Manager administration environment. This is where senior folks can
 * manage the portal, volunteers and everything related to that.
 */
export function AdminLayout(props: React.PropsWithChildren) {
    const year = (new Date()).getFullYear();

    return (
        <ThemeProvider theme={createAdminTheme(/* mode= */ 'light')}>
            <Box sx={kStyles.root}>
                <Box sx={kStyles.container}>
                    {props.children}
                    <Typography component="footer" align="center" variant="body2" sx={{ mt: 1 }}>
                        AnimeCon Volunteer Portal (<a href="https://github.com/AnimeNL/volunteer-manager">{process.env.buildHash}</a>) — © 2015–{year}
                    </Typography>
                </Box>
            </Box>
        </ThemeProvider>
    );
}

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { PaletteMode } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { createCachedTheme } from './ClientTheme';
import { dayjs } from '@lib/DateTime';

/**
 * Props accepted by the <ClientProviders> component.
 */
export interface ClientProvidersProps {
    /**
     * Whether dark mode should be enabled on the page. Defaults to `auto`.
     */
    paletteMode?: PaletteMode | 'auto';

    /**
     * Theme colours for the environment that's being displayed. Other colours will be computed.
     */
    themeColours?: { [key in PaletteMode]: string };
}

/**
 * Providers that should be made available to client-side JavaScript across the entire Volunteer
 * Manager, regardless of which sub-application is being used.
 *
 * @see https://nextjs.org/docs/getting-started/react-essentials
 * @see https://mui.com/material-ui/guides/next-js-app-router/
 */
export function ClientProviders(props: React.PropsWithChildren<ClientProvidersProps>) {
    const paletteMode = props.paletteMode ?? 'auto';
    const themeColours = props.themeColours ?? {
        dark: '#b2dfdb',
        light: '#00796b',
    };

    // If |darkMode| is set to `auto`, we need to resolve the actual state to preferences of the
    // operating system. This is done by observing a media query.
    const systemPrefersDarkColorScheme = useMediaQuery('(prefers-color-scheme: dark)');
    const effectiveDarkModeState: PaletteMode =
        paletteMode === 'auto' ? (systemPrefersDarkColorScheme ? 'dark' : 'light')
                               : paletteMode;

    return (
        <ThemeProvider theme={createCachedTheme(themeColours, effectiveDarkModeState)}>
            <CssBaseline />
            <LocalizationProvider dateAdapter={AdapterDayjs} dateLibInstance={dayjs}>
                {props.children}
            </LocalizationProvider>
        </ThemeProvider>
    )
}

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { NextAppDirEmotionCacheProvider } from 'tss-react/next/appDir';

import type { PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { createCachedTheme } from './ClientTheme';

/**
 * Props accepted by the <ClientProviders> component.
 */
export interface ClientProvidersProps {
    /**
     * Whether dark mode should be enabled on the page. Defaults to `auto`.
     */
    darkMode?: 'auto' | 'dark' | 'light';

    /**
     * Theme colours for the environment that's being displayed. Other colours will be computed.
     */
    themeColours?: { [key in PaletteMode]: string };
}

/**
 * Providers that should be made available to client-side JavaScript, but isn't relevant to server-
 * side JavaScript. Follows the documentation from the following page:
 *
 * https://nextjs.org/docs/getting-started/react-essentials#rendering-third-party-context-providers-in-server-components
 */
export function ClientProviders(props: React.PropsWithChildren<ClientProvidersProps>) {
    const darkMode = props.darkMode ?? 'auto';
    const themeColours = props.themeColours ?? {
        dark: '#b2dfdb',
        light: '#00796b',
    };

    // If |darkMode| is set to `auto`, we need to resolve the actual state to preferences of the
    // operating system. This is done by observing a media query.
    const systemPrefersDarkColorScheme = useMediaQuery('(prefers-color-scheme: dark)');
    const effectiveDarkModeState: PaletteMode =
        darkMode === 'auto' ? (systemPrefersDarkColorScheme ? 'dark' : 'light')
                            : darkMode;

    return (
        <>
            <CssBaseline />
            <NextAppDirEmotionCacheProvider options={{ key: 'css' }}>
                <ThemeProvider theme={createCachedTheme(themeColours, effectiveDarkModeState)}>
                    {props.children}
                </ThemeProvider>
            </NextAppDirEmotionCacheProvider>
        </>
    )
}

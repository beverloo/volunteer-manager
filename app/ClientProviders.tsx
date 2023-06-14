// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { NextAppDirEmotionCacheProvider } from 'tss-react/next/appDir';
import { type PaletteMode } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { type Environment } from './Environment';
import { createCachedTheme } from './ClientTheme';

/**
 * Props accepted by the <ClientProviders /> React component.
 */
export interface ClientProvidersProps {
    /**
     * Children that should be rendered. Can be both server and client components.
     */
    children: React.ReactElement;

    /**
     * Whether dark mode should be enabled on the page. Defaults to `auto`.
     */
    darkMode?: 'auto' | 'dark' | 'light';

    /**
     * The environment for which the page is being displayed.
     */
    environment: Environment;
}

/**
 * Providers that should be made available to client-side JavaScript, but isn't relevant to server-
 * side JavaScript. Follows the documentation from the following page:
 *
 * https://nextjs.org/docs/getting-started/react-essentials#rendering-third-party-context-providers-in-server-components
 */
export function ClientProviders(props: ClientProvidersProps) {
    const darkMode = props.darkMode ?? 'auto';
    const environment = props.environment;

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
                <ThemeProvider theme={createCachedTheme(environment, effectiveDarkModeState)}>
                    {props.children}
                </ThemeProvider>
            </NextAppDirEmotionCacheProvider>
        </>
    )
}

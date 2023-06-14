// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { NextAppDirEmotionCacheProvider } from 'tss-react/next/appDir';
import { ThemeProvider } from '@mui/material/styles';

import { kTheme } from './ClientTheme';

/**
 * Props accepted by the <ClientProviders /> React component.
 */
export interface ClientProvidersProps {
  children: React.ReactElement;
}

/**
 * Providers that should be made available to client-side JavaScript, but isn't relevant to server-
 * side JavaScript. Follows the documentation from the following page:
 *
 * https://nextjs.org/docs/getting-started/react-essentials#rendering-third-party-context-providers-in-server-components
 */
export function ClientProviders(props: ClientProvidersProps) {
    return (
        <>
            <CssBaseline />
            <NextAppDirEmotionCacheProvider options={{ key: "css" }}>
                <ThemeProvider theme={kTheme}>
                    {props.children}
                </ThemeProvider>
            </NextAppDirEmotionCacheProvider>
        </>
    )
}

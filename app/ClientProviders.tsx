// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { CacheProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';

import { createCache } from './ClientCache';
import { kTheme } from './ClientTheme';

/**
 * Client-side cache, kept around for the entire browsing session.
 */
const kCache = createCache();

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
        <CacheProvider value={kCache}>
            <ThemeProvider theme={kTheme}>
                <CssBaseline />
                {props.children}
            </ThemeProvider>
        </CacheProvider>
    )
}

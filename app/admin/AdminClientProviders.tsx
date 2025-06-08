// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { ThemeProvider, type PaletteMode } from '@mui/material/styles';

import { createAdminTheme } from './AdminClientTheme';

/**
 * Props accepted by the <AdminClientProviders> component.
 */
interface AdminClientProvidersProps {
    /**
     * Palette mode that should be active for the admin area.
     */
    paletteMode: PaletteMode;
}

/**
 * Client-side providers that need to be set as part of the administration area layout.
 */
export function AdminClientProviders(props: React.PropsWithChildren<AdminClientProvidersProps>) {
    return (
        <ThemeProvider theme={createAdminTheme(props.paletteMode)}>
            <NuqsAdapter>
                {props.children}
            </NuqsAdapter>
        </ThemeProvider>
    );
}

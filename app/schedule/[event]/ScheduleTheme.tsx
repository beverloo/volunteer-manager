// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { createContext, useCallback, useMemo, useState } from 'react';

import type { PaletteMode } from '@mui/material';
import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import Box from '@mui/material/Box';

/**
 * Palette mode that the schedule app can be in. Extends the regular MUI palette.
 */
type SchedulePaletteMode = PaletteMode | 'auto';

/**
 * Data stored within the theme context.
 */
export interface ScheduleThemeContextInfo {
    /**
     * Whether the schedule app should be in dark mode, light mode, or be inferred.
     */
    mode: SchedulePaletteMode;

    /**
     * Updates the palette mode for the schedule. Will persist between page loads for the local
     * client, but not across clients for the same user.
     */
    updateMode?: (mode: SchedulePaletteMode) => void;
}

/**
 * The <ScheduleThemeContext> carries information about the theme that can be accessed and
 * manipulated throughout the volunteer portal.
 */
export const ScheduleThemeContext = createContext<ScheduleThemeContextInfo>({
    mode: 'auto',
});

/**
 * Cache key in the local storage in which we'll store the configured palette mode.
 */
const kCacheKey = 'acPalette';

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
 * Reads the palette mode from local cache, or `auto` as the default value when none has been set.
 */
function readPaletteModeFromCache(): SchedulePaletteMode {
    if (typeof globalThis.localStorage === 'undefined')
        return 'auto';   // bail out for server-side rendering

    try {
        const paletteMode = localStorage.getItem(kCacheKey);
        switch (paletteMode) {
            case 'light':
            case 'dark':
                return paletteMode;
        }
    } finally { /* nothing to do */ }

    return 'auto';
}

/**
 * Stores the given `mode` as the locally cached palette mode. It's not clear whether the try/catch
 * is necessary here, it's added due to historic trauma with Private Mode in iOS Safari.
 */
function storePaletteModeToCache(mode: SchedulePaletteMode) {
    try {
        switch (mode) {
            case 'light':
            case 'dark':
                localStorage.setItem(kCacheKey, mode);
                break;

            default:
                localStorage.removeItem(kCacheKey);
                break;
        }
    } finally { /* nothing to do */ }
}

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

    const [ mode, setMode ] = useState<SchedulePaletteMode>(() => readPaletteModeFromCache());

    const updateMode = useCallback((mode: SchedulePaletteMode) => {
        storePaletteModeToCache(mode);
        setMode(mode);
    }, [ /* no deps */ ]);

    const context = useMemo((): ScheduleThemeContextInfo => {
        return { mode, updateMode };
    }, [ mode, updateMode ]);

    const theme = useMemo(() => {
        switch (mode) {
            case 'light':
            case 'dark':
                return createScheduleTheme(mode === 'dark');

            default:
                return createScheduleTheme(!!prefersDarkMode);
        }
    }, [ mode, prefersDarkMode ]);

    return (
        <ScheduleThemeContext.Provider value={context}>
            <ThemeProvider theme={theme}>
                <Box sx={kStyles.container}>
                    {props.children}
                </Box>
            </ThemeProvider>
        </ScheduleThemeContext.Provider>
    );
}

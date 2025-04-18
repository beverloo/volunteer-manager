// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { PaletteMode } from '@mui/material';
import type { Theme, ThemeOptions } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { deepmerge } from '@mui/utils';

import { grey } from '@mui/material/colors';

/**
 * Mixins that should be added to a created type depending on the chosen palette mode.
 */
const kThemePaletteModeMixins: { [key in PaletteMode]: ThemeOptions } = {
    dark: {
        palette: {
            animecon: { /* empty */ } as any,  // not applicable for the admin area
            background: {
                default: '#111111',
                paper: grey[900],
            },
        },
    },
    light: {
        palette: {
            animecon: { /* empty */ } as any,  // not applicable for the admin area
            background: {
                default: '#f8faf0',
            },
        },
    },
};

/**
 * Cached version of the theme to use for the administration area.
 */
let globalAdminTheme: Theme | undefined;

/**
 * Returns the theme to use in the administrative area.
 */
export function createAdminTheme(mode: PaletteMode): Theme {
    if (!globalAdminTheme || globalAdminTheme.palette.mode !== mode) {
        globalAdminTheme = createTheme(deepmerge(kThemePaletteModeMixins[mode], {
            palette: {
                mode,

                primary: {
                    main: '#37474F',
                },

                DataGrid: {
                    bg: 'transparent',
                },
            }
        }));
    }

    return globalAdminTheme;
}

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { PaletteMode } from '@mui/material';
import type { Theme, ThemeOptions } from '@mui/material/styles';
import { createTheme, darken, lighten } from '@mui/material/styles';
import { deepmerge } from '@mui/utils';

import grey from '@mui/material/colors/grey';

/**
 * Mixins that should be added to a created type depending on the chosen palette mode.
 */
const kThemePaletteModeMixins: { [key in PaletteMode]: ThemeOptions } = {
    dark: {
        palette: {
            background: {
                default: '#111111',
                paper: grey[900],
            },
        },
    },
    light: {
        palette: {
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
            components: {
                MuiDataGrid: {
                    styleOverrides: {
                        root: {
                            '--DataGrid-containerBackground': 'transparent',
                        }
                    },
                },
            },
            palette: {
                mode,

                primary: {
                    main: '#37474F',
                },
            }
        }));
    }

    return globalAdminTheme;
}

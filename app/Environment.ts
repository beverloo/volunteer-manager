// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { PaletteMode } from '@mui/material';

/**
 * The environments (identified as origins) supported by the volunteer manager.
 */
export type Environment = 'animecon.team' | 'gophers.team' | 'hosts.team' | 'stewards.team';

/**
 * The colour scheme variables that have to be specified for each of the environments.
 */
export type EnvironmentMainColourForPaletteMode = {
    [key in PaletteMode]: string;
};

/**
 * The primary and secondary colours of the different environments supported by the volunteer
 * manager. This object must contain an entry for each of the values in the Environment enum.
 */
export const kEnvironmentColours: { [key in Environment]: EnvironmentMainColourForPaletteMode } = {
    'animecon.team': {
        dark: '#b2dfdb',
        light: '#00796b',
    },
    'gophers.team': {
        dark: '#d7ccc8',
        light: '#5d4037',
    },
    'hosts.team': {
        dark: '#f8bbd0',
        light: '#880e4f',
    },
    'stewards.team': {
        dark: '#90caf9',
        light: '#303f9f',
    },
};

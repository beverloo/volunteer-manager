// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { default as MuiAlert } from '@mui/material/Alert';
import { amber, lightBlue } from '@mui/material/colors';
import { darken, lighten } from '@mui/system/colorManipulator';
import { styled } from '@mui/material/styles';

/**
 * Specialization of <Alert> with appropriate dark mode-aware background colours, at least for the
 * standard display mode. MUI's own colour decision look quite out of place.
 */
export const Alert = styled(MuiAlert)(({ theme }) => {
    const isDarkMode = theme.palette.mode === 'dark';
    return {
        '&.MuiAlert-standardError': {
            backgroundColor: isDarkMode ? darken(theme.palette.error.dark, 0.4)
                                        : lighten(theme.palette.error.light, 0.6),
        },
        '&.MuiAlert-standardInfo': {
            backgroundColor: isDarkMode ? darken(lightBlue[900], 0.15)
                                        : lightBlue['100'],
        },
        '&.MuiAlert-standardSuccess': {
            backgroundColor: isDarkMode ? darken(theme.palette.success.dark, 0.35)
                                        : lighten(theme.palette.success.light, 0.9),
        },
        '&.MuiAlert-standardWarning': {
            backgroundColor: isDarkMode ? darken(theme.palette.warning.dark, 0.35)
                                        : amber['A200'],
        },
    };
});

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Box from '@mui/material/Box';
import { darken, lighten } from '@mui/system';
import { styled } from '@mui/material/styles';

/**
 * A contrast box is a regular <Box> with a grey background that makes it stand slightly apart from
 * the rest of the content. The background colour is calculated based on whether dark mode is used.
 */
export const ContrastBox = styled(Box)(({ theme }) => {
    const getBackgroundColor = theme.palette.mode === 'light' ? lighten : darken;
    return {
        backgroundColor: getBackgroundColor(theme.palette.action.active, 0.9),
        borderRadius: theme.shape.borderRadius,
    };
});

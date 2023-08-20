// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Paper, { type PaperProps, paperClasses } from '@mui/material/Paper';
import { styled } from '@mui/material/styles';

/**
 * The <PlaceholderPaper> component can be used instead of a <Paper> component, although rather than
 * drawing a realistic paper it draws a dashed-border outlined version of one.
 */
export const PlaceholderPaper = styled((props: Omit<PaperProps, 'elevation'>) => (
    <Paper {...props} elevation={0}>
        {props.children}
    </Paper>
))(({ theme }) => ({
    [`&.${paperClasses.root}`]: {
        border: '2px dashed rgba(0, 0, 0, .1)',
        backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, .05)'
                                                        : 'rgba(255, 255, 255, .05)',
    },
}));

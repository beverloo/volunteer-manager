// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Paper, { type PaperProps } from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';

/**
 * The <PlaceholderPaper> component can be used instead of a <Paper> component, although rather than
 * drawing a realistic paper it draws a dashed-border outlined version of one.
 */
export function PlaceholderPaper(props: Omit<PaperProps, 'elevation'>) {
    const { sx, ...otherProps } = props;

    const theme = useTheme();
    return (
        <Paper {...otherProps} elevation={0}
               sx={{
                   ...sx,
                   border: '2px dashed rgba(0, 0, 0, .1)',
                   backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, .05)'
                                                                   : 'rgba(255, 255, 255, .05)',
               }} />
    );
}

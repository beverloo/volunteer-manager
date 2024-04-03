// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import List from '@mui/material/List';
import Paper from '@mui/material/Paper';
import type React from 'react';

/**
 * Styles to apply to <Header> & friends.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    primaryTypography: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
};

/**
 * Props accepted by the <Header> component.
 */
export interface HeaderProps {
    /**
     * Primary title to display on the header.
     */
    title: string;

    /**
     * Secondary title to display on the header, if any.
     */
    subtitle?: string;

    /**
     * Icon, if any, to display as part of the header.
     */
    icon?: React.ReactNode;
}

/**
 * The <Header> component displays a header, in a style consistent with all other page headers part
 * of the scheduling app. The header is not actionable by default.
 */
export function Header(props: HeaderProps) {
    const { title, subtitle, icon } = props;
    return (
        <Paper sx={{ maxWidth: '100vw' }}>
            <List>
                <ListItem>
                    <ListItemText primary={title}
                                  primaryTypographyProps={{ sx: kStyles.primaryTypography }}
                                  secondary={subtitle} />
                </ListItem>
            </List>
        </Paper>
    );
}

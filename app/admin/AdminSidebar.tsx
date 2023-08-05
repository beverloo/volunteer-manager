// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { SxProps, Theme } from '@mui/system';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

/**
 * Custom styles applied to the <AdminSidebar> & related components.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    header: {
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        paddingX: 2,
        paddingY: 1,
    },
};

/**
 * Props accepted by the <AdminSidebar> component.
 */
export interface AdminSidebarProps {
    /**
     * Title to display at the top of the sidebar.
     */
    title: string;
}

/**
 * The <AdminSidebar> component displays a navigational menu with the configured menu items passed
 * through its props. Expected to render as a child of the <AdminContent> component.
 */
export function AdminSidebar(props: AdminSidebarProps) {
    const { title } = props;

    return (
        <Paper sx={{ width: '280px', overflow: 'hidden' }}>
            <Typography variant="h6" sx={kStyles.header}>
                {title}
            </Typography>
        </Paper>
    );
}

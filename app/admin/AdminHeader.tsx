// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { SxProps, Theme } from '@mui/system';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import GridViewIcon from '@mui/icons-material/GridView';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { UserData } from '@app/lib/auth/UserData';
import { Avatar } from '@app/components/Avatar';

/**
 * Custom styles applied to the <AdminHeader> & related components.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    container: {
        backgroundColor: 'primary.main',
        borderTopLeftRadius: theme => `${theme.shape.borderRadius}px`,
        borderTopRightRadius: theme => `${theme.shape.borderRadius}px`,
        paddingX: 2,
        paddingY: 1,
    },
};

/**
 * Props accepted by the <AdminHeaderButton> component.
 */
interface AdminHeaderButtonProps {
    // TODO: active

    /**
     * Optional children for the button. Used when menus should be drawn upon activation.
     */
    children?: React.ReactNode;

    /**
     * Icon that should be displayed on the button.
     */
    icon: React.ReactNode;

    /**
     * Label that should be displayed under the button's icon.
     */
    label: string;
}

/**
 * The <AdminHeaderButton> component displays a single button in the administration area's header
 * bar. This is the main means for users to navigate between different sections of the site.
 */
function AdminHeaderButton(props: AdminHeaderButtonProps) {
    return (
        <Box>
            {props.label}
        </Box>
    );
}

/**
 * Props accepted by the <AdminHeader> component.
 */
export interface AdminHeaderProps {
    /**
     * The user who is currently viewing the administration area.
     */
    user: UserData;
}

/**
 * The <AdminHeader> component displays a bar at the top of the screen for the administration
 * environment, that shows the available sub-sections. Global to the admin environment.
 */
export function AdminHeader(props: AdminHeaderProps) {
    const { user } = props;

    return (
        <Paper>
            <Stack direction="row" justifyContent="space-between" alignItems="center"
                spacing={2} sx={kStyles.container}>

                <Typography color="primary.contrastText" variant="h6">
                    AnimeCon Volunteer Manager
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center">
                    <Typography color="primary.contrastText">
                        {user.firstName}
                    </Typography>
                    <Avatar src={user.avatarUrl}>
                        {user.firstName} {user.lastName}
                    </Avatar>
                </Stack>

            </Stack>
            <Stack direction="row" alignItems="center" spacing={2}>
                <AdminHeaderButton icon={ <GridViewIcon /> }
                                   label="Dashboard" />
                <AdminHeaderButton icon={ <GridViewIcon /> }
                                   label="Events" />
                <AdminHeaderButton icon={ <GridViewIcon /> }
                                   label="Volunteers" />
            </Stack>
            <Divider />
        </Paper>
    );
}

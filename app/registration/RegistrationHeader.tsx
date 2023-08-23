// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { SxProps, Theme } from '@mui/system';
import Avatar from '@mui/material/Avatar';
import FaceIcon from '@mui/icons-material/Face';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { UserData } from '@lib/auth/UserData';
import { AuthenticationHeaderChip } from './AuthenticationHeaderChip';

/**
 * Manual styles that apply to the <RegistrationHeader> client component.
 */
export const kStyles: { [key: string]: SxProps<Theme> } = {
    avatar: {
        backgroundColor: 'primary.light',
        color: theme => theme.palette.getContrastText(theme.palette.primary.light),
    },
    header: {
        backgroundColor: 'primary.dark',
        color: theme => theme.palette.getContrastText(theme.palette.primary.dark),
        display: 'flex',

        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,

        margin: 0,
        paddingX: 2,
        paddingY: 1,
    },
    text: {
        flex: 1,
        paddingRight: 2,
    },
};

/**
 * Props accepted by the <RegistrationHeader> client component.
 */
export interface RegistrationHeaderProps {
    /**
     * To be called when the user chip has been clicked on, indicating that the authentication flow
     * should be opened. This works the same for guests and signed in users.
     */
    onUserChipClick: () => void;

    /**
     * Title of the page that should be displayed on the header.
     */
    title: string;

    /**
     * Information about the signed in user, as they should be shown in the header.
     */
    user?: UserData;
}

/**
 * The <RegistrationHeader> component displays a consistent header that includes not just the page
 * title, but also the signed in user's avatar (if any) providing access to their information as
 * well as the ability for them to sign out.
 */
export function RegistrationHeader(props: RegistrationHeaderProps) {
    // TODO: Include the user's avatar.

    return (
        <Stack direction="row" justifyContent="space-between" sx={kStyles.header}>
            <Typography sx={kStyles.text} variant="h5" component="h1" noWrap>
                {props.title}
            </Typography>
            { props.user &&
                <AuthenticationHeaderChip clickable
                                          avatar={
                                              <Avatar src={props.user.avatarUrl}
                                                      sx={kStyles.avatar}>
                                                  PB
                                              </Avatar> }
                                          label={props.user.firstName}
                                          onClick={props.onUserChipClick} /> }
            { !props.user &&
                <AuthenticationHeaderChip clickable
                                          /// @ts-ignore
                                          icon={ <FaceIcon /> }
                                          label="Sign in"
                                          onClick={props.onUserChipClick} /> }
        </Stack>
    );
}

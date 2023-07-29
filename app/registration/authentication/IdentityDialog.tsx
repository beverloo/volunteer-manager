// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { useCallback, useState } from 'react';

import type { SxProps, Theme } from '@mui/system';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import LoadingButton from '@mui/lab/LoadingButton';

import type { UpdateAvatarDefinition } from '@app/api/auth/updateAvatar';
import type { UserData } from '@lib/auth/UserData';
import { Avatar } from '@components/Avatar';
import { issueServerAction } from '../AuthenticationFlow';

/**
 * Styles used by the identity dialog.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    avatarContainer: {
        textAlign: 'center',
    },
};

/**
 * Props accepted by the <IdentityDialog> component.
 */
interface IdentityDialogProps {
    /**
     * To be invoked when the form should be closed, e.g. by being cancelled.
     */
    onClose: () => void;

    /**
     * To be invoked when the user wants to sign out of their account. Requires an API call.
     */
    onSignOut: () => Promise<void>;

    /**
     * Information about the signed in user. The Identity dialog can only be shown for signed in
     * users, otherwise there wouldn't be anything to display.
     */
    user: UserData;
}

/**
 * The <IdentityDialog> dialog displays information about the signed in user, and gives them the
 * ability to sign out of their account. We also display a series of badges, one per events in which
 * they participated, kind of as a collectable.
 */
export function IdentityDialog(props: IdentityDialogProps) {
    const { onClose, onSignOut, user } = props;

    // TODO: Badges

    const [ loading, setLoading ] = useState<boolean>(false);
    const requestSignOut = useCallback(async () => {
        setLoading(true);

        try {
            await onSignOut();
        } finally {
            setLoading(false);
        }
    }, [ onSignOut ]);

    const requestAvatarUpdate = useCallback(async (avatar: Blob) => {
        try {
            const base64Header = 'data:image/png;base64,';
            const base64Avatar = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onloadend =
                    () => resolve((reader.result as string).substring(base64Header.length));
                reader.readAsDataURL(avatar);
            });

            const response = await issueServerAction<UpdateAvatarDefinition>(
                '/api/auth/update-avatar',
                {
                    avatar: base64Avatar as string,
                });

            // TODO: Update the user's avatar URL.
            return response.success;

        } catch (error) {
            console.error('Unable to upload a new avatar:', error);
        }

        return false;

    }, [ /* no dependencies */ ]);

    return (
        <>
            <DialogContent>
                <Container sx={kStyles.avatarContainer}>
                    <Avatar editable onChange={requestAvatarUpdate} size="large"
                            src={user.avatarUrl}>
                        {user.firstName} {user.lastName}
                    </Avatar>
                </Container>
                <DialogContentText>
                    Hi {user.firstName}, you're signed in.
                </DialogContentText>
                { /* TODO: Badges */ }
            </DialogContent>
            <DialogActions>
                <LoadingButton loading={loading} onClick={requestSignOut}>
                    Sign out
                </LoadingButton>
                <Button onClick={onClose} variant="contained">Close</Button>
            </DialogActions>
        </>
    );
}

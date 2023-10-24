// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { useCallback, useEffect, useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import LoadingButton from '@mui/lab/LoadingButton';
import Typography from '@mui/material/Typography';

import type { User } from '@lib/auth/User';
import { callApi } from '@lib/callApi';

/**
 * Props accepted by the <IdentityPasskeysDialog> component.
 */
interface IdentityPasskeysDialogProps {
    /**
     * To be invoked when the form should be closed, e.g. by being cancelled.
     */
    onClose: () => void;

    /**
     * Information about the signed in user. This dialog is only available to signed in users.
     */
    user: User;
}

/**
 * The <IdentityPasskeysDialog> dialog enables the user to manage their passkeys and create a new
 * one for their current device, in case they don't have any yet.
 */
export function IdentityPasskeysDialog(props: IdentityPasskeysDialogProps) {
    const { onClose, user } = props;

    const [ creationError, setCreationError ] = useState<string | undefined>();
    const [ creationLoading, setCreationLoading ] = useState<boolean>(false);
    const [ creationSuccess, setCreationSuccess ] = useState<boolean>(false);

    const handleCreatePasskey = useCallback(async () => {
        setCreationError(undefined);
        setCreationLoading(true);
        try {
            const challenge = await callApi('post', '/api/auth/passkeys/create-challenge', { });
            if (!challenge.success || !challenge.options)
                throw new Error(challenge.error ?? 'Unable to create a passkey challenge');

            const registration = await startRegistration(challenge.options);
            const response = await callApi('post', '/api/auth/passkeys/register', { registration });
            if (!response.success)
                throw new Error(response.error ?? 'Unable to register the passkey');

            // TODO: Renew the list of passkeys that exist for the user
            setCreationSuccess(true);

        } catch (error: any) {
            setCreationError(error.message);
        } finally {
            setCreationLoading(false);
        }

    }, [ /* no dependencies */ ]);

    // TODO: Delete
    // TODO: List

    return (
        <>
            <DialogTitle>Manage passkeys</DialogTitle>
            <DialogContent>
                <Typography>
                    Passkeys are a more convenient and safer alternative to passwords. You can have
                    multiple associated with your AnimeCon Volunteer account.
                </Typography>
                <LoadingButton loading={creationLoading} onClick={handleCreatePasskey}
                               variant="outlined">
                    Create passkey
                </LoadingButton>
                <Collapse in={!!creationSuccess}>
                    <Alert severity="success">
                        The new passkey was successfully created!
                    </Alert>
                </Collapse>
                <Collapse in={!!creationError}>
                    <Alert severity="error">
                        {creationError}
                    </Alert>
                </Collapse>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained">Close</Button>
            </DialogActions>
        </>
    );
}

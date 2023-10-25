// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { useCallback, useEffect, useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type { ListPasskeysDefinition } from '@app/api/auth/passkeys/listPasskeys';
import type { User } from '@lib/auth/User';
import { callApi } from '@lib/callApi';

type Passkeys = ListPasskeysDefinition['response']['passkeys'];

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

    const [ error, setError ] = useState<string | undefined>();
    const [ success, setSuccess ] = useState<string | undefined>();

    const [ creationLoading, setCreationLoading ] = useState<boolean>(false);

    const handleCreatePasskey = useCallback(async () => {
        setCreationLoading(true);
        setError(undefined);
        setSuccess(undefined);
        try {
            const challenge = await callApi('post', '/api/auth/passkeys/create-challenge', { });
            if (!challenge.success || !challenge.options)
                throw new Error(challenge.error ?? 'Unable to create a passkey challenge');

            const registration = await startRegistration(challenge.options);
            const response = await callApi('post', '/api/auth/passkeys/register', { registration });
            if (!response.success)
                throw new Error(response.error ?? 'Unable to register the passkey');

            // TODO: Renew the list of passkeys that exist for the user
            setSuccess('The new passkey was successfully created!');

        } catch (error: any) {
            setError(error.message);
        } finally {
            setCreationLoading(false);
        }

    }, [ /* no dependencies */ ]);

    // TODO: Delete

    const [ passkeysLoading, setPasskeysLoading ] = useState<boolean>(false);
    const [ passkeys, setPasskeys ] = useState<Passkeys>();

    useEffect(() => {
        setPasskeysLoading(true);
        callApi('get', '/api/auth/passkeys/list', { /* no props */ }).then(response => {
            if (response.success)
                setPasskeys(response.passkeys);
            else
                setError(response.error ?? 'Unable to load your passkeys');
        }).catch(error => {
            setError(error.message);
        }).finally(() => setPasskeysLoading(false));
    }, [ user.userId ]);

    return (
        <>
            <DialogTitle>Manage passkeys</DialogTitle>
            <DialogContent>
                <Typography>
                    Passkeys are a more convenient and safer alternative to passwords. You can have
                    multiple associated with your AnimeCon Volunteer account.
                </Typography>
                <List disablePadding sx={{
                    mt: 1,
                    border: '1px solid transparent',
                    borderColor: 'divider',
                    borderRadius: '4px',
                }}>
                    { !!passkeysLoading &&
                        <ListItem divider sx={{ flexDirection: 'column' }}>
                            <Skeleton animation="wave" width="93%" height={10} />
                            <Skeleton animation="wave" width="81%" height={10} />
                            <Skeleton animation="wave" width="88%" height={10} />
                        </ListItem> }

                    { !passkeysLoading && (!passkeys || !passkeys.length) &&
                        <ListItem divider sx={{ backgroundColor: 'action.hover' }}>
                            <ListItemText inset primary="You don't have any passkeys yet!" />
                        </ListItem> }

                    { !passkeysLoading && !!passkeys && passkeys.map((passkey, index) =>
                        <ListItem divider key={index}>
                            <ListItemIcon>
                                <FingerprintIcon />
                            </ListItemIcon>
                            <ListItemText primary={passkey.label} secondary={passkey.description} />
                            <ListItemSecondaryAction>
                                <Tooltip title="Delete this passkey">
                                    <IconButton>
                                        <HighlightOffIcon color="error" />
                                    </IconButton>
                                </Tooltip>
                            </ListItemSecondaryAction>
                        </ListItem> )}

                    <ListItemButton onClick={handleCreatePasskey}>
                        <ListItemIcon>
                            <AddCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText primary="Create a new passkey" />
                    </ListItemButton>
                </List>
                <Collapse in={!!success}>
                    <Alert severity="success" sx={{ mt: 2 }}>
                        {success}
                    </Alert>
                </Collapse>
                <Collapse in={!!error}>
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                </Collapse>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained">Close</Button>
            </DialogActions>
        </>
    );
}

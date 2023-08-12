// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { SxProps, Theme } from '@mui/system';
import Button from '@mui/material/Button';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import LoadingButton from '@mui/lab/LoadingButton';
import LockResetIcon from '@mui/icons-material/LockReset';
import Paper from '@mui/material/Paper';
import PinIcon from '@mui/icons-material/Pin';
import SecurityIcon from '@mui/icons-material/Security';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import Typography from '@mui/material/Typography';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import { green } from '@mui/material/colors';

import type { ResetAccessCodeDefinition } from '@app/api/admin/resetAccessCode';
import type { ResetPasswordLinkDefinition } from '@app/api/admin/resetPasswordLink';
import type { UpdateActivationDefinition } from '@app/api/admin/updateActivation';
import type { VolunteerInfo } from './page';
import { issueServerAction } from '@lib/issueServerAction';

/**
 * Custom styles applied to the <Header> component.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    options: {
        borderRadius: 1,
        paddingX: 2,
        paddingY: 1,
        marginTop: 1,
        backgroundColor: theme => theme.palette.mode === 'light' ? theme.palette.grey[200]
                                                                 : theme.palette.grey[800],
    },
    success: {
        borderRadius: 1,
        marginTop: 2,
        paddingX: 2,
        paddingY: 1,
        backgroundColor: theme => theme.palette.mode === 'light' ? green[100] : green[800],
    }
};

/**
 * Props passed to the various dialog properties.
 */
interface DialogProps {
    /**
     * The account of the volunteer for whom this dialog is being shown.
     */
    account: VolunteerInfo['account'];

    /**
     * Callback function that should be called when the dialog is being closed.
     */
    onClose: (refresh?: boolean) => void;

    /**
     * Whether the dialog is currently open.
     */
    open?: boolean;
}

/**
 * Dialog that creates and/or retrieves a new access code for the volunteer. This enables the
 * volunteer to sign in once with a code as opposed to their password.
 */
function AccessCodeDialog(props: DialogProps) {
    const { account, onClose, open } = props;

    const [ accessCode, setAccessCode ] = useState<string>();
    const [ loading, setLoading ] = useState(false);

    const handleClose = useCallback(() =>
        onClose(/* refresh= */ !!accessCode), [ onClose, accessCode ]);

    const handleRequest = useCallback(async() => {
        setLoading(true);
        try {
            const response = await issueServerAction<ResetAccessCodeDefinition>(
                '/api/admin/reset-access-code',
                { userId: account.userId });

            if (response.accessCode)
                setAccessCode(response.accessCode);

        } finally {
            setLoading(false);
        }
    }, [ account ]);

    return (
        <Dialog open={!!open} onClose={handleClose} fullWidth>
            <DialogTitle>
                Request an access code
            </DialogTitle>
            <DialogContent>
                <Typography>
                    You can request an access code for <strong>{account.firstName}</strong> using
                    which they can sign in to their account once and reset their password.
                </Typography>
                <Collapse in={!!accessCode}>
                    <Stack direction="row" spacing={2} sx={kStyles.success}>
                        <ThumbUpIcon fontSize="small" />
                        <Typography>
                            Their access code is <strong>{accessCode}</strong>
                        </Typography>
                    </Stack>
                </Collapse>
            </DialogContent>
            <DialogActions sx={{ pt: 0, mr: 2, mb: 2 }}>
                <Button onClick={handleClose} variant="text">Cancel</Button>
                <LoadingButton disabled={!!accessCode} loading={loading} onClick={handleRequest}
                               variant="contained">
                    Continue
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
}

/**
 * Dialog that activates the volunteer's account. This enables their account for usage, meaning that
 * they can immediately continue with (hopefully!) participation.
 */
function ActivateDialog(props: DialogProps) {
    const { account, onClose, open } = props;

    const [ done, setDone ] = useState(false);
    const [ loading, setLoading ] = useState(false);

    const handleClose = useCallback(() => onClose(/* refresh= */ done), [ done, onClose ]);
    const handleRequest = useCallback(async() => {
        setLoading(true);
        try {
            const response = await issueServerAction<UpdateActivationDefinition>(
                '/api/admin/update-activation',
                {
                    userId: account.userId,
                    activated: true,
                });

            if (response.success)
                setDone(true);
        } finally {
            setLoading(false);
        }
    }, [ account ]);

    return (
        <Dialog open={!!open} onClose={handleClose} fullWidth>
            <DialogTitle>
                Activate the account
            </DialogTitle>
            <DialogContent>
                <Typography>
                    You can activate <strong>{account.firstName}</strong>'s account on their behalf,
                    which may be useful in case they aren't receiving our e-mail message.
                </Typography>
                <Collapse in={done}>
                    <Stack direction="row" spacing={2} sx={kStyles.success}>
                        <ThumbUpIcon fontSize="small" />
                        <Typography>
                            Their account has been activated.
                        </Typography>
                    </Stack>
                </Collapse>
            </DialogContent>
            <DialogActions sx={{ pt: 0, mr: 2, mb: 2 }}>
                <Button onClick={handleClose} variant="text">Close</Button>
                <LoadingButton disabled={done} loading={loading} onClick={handleRequest}
                               variant="contained">
                    Activate
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
}

/**
 * Dialog that deactivates the volunteer's account. This prevents it from being used until another
 * administrator (re)enables their account.
 */
function DeactivateDialog(props: DialogProps) {
    const { account, onClose, open } = props;

    const [ done, setDone ] = useState(false);
    const [ loading, setLoading ] = useState(false);

    const handleClose = useCallback(() => onClose(/* refresh= */ done), [ done, onClose ]);
    const handleRequest = useCallback(async() => {
        setLoading(true);
        try {
            const response = await issueServerAction<UpdateActivationDefinition>(
                '/api/admin/update-activation',
                {
                    userId: account.userId,
                    activated: false,
                });

            if (response.success)
                setDone(true);
        } finally {
            setLoading(false);
        }
    }, [ account ]);

    return (
        <Dialog open={!!open} onClose={handleClose} fullWidth>
            <DialogTitle>
                Deactivate the account
            </DialogTitle>
            <DialogContent>
                <Typography>
                    You can deactivate the account owned by <strong>{account.firstName}</strong>,
                    which will sign them out and stop them from signing in again.
                </Typography>
                <Collapse in={done}>
                    <Stack direction="row" spacing={2} sx={kStyles.success}>
                        <ThumbUpIcon fontSize="small" />
                        <Typography>
                            Their account has been deactivated.
                        </Typography>
                    </Stack>
                </Collapse>
            </DialogContent>
            <DialogActions sx={{ pt: 0, mr: 2, mb: 2 }}>
                <Button onClick={handleClose} variant="text">Close</Button>
                <LoadingButton disabled={done} loading={loading} onClick={handleRequest}
                               variant="contained">
                    Deactivate
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
}

/**
 * Dialog that requests a reset of the volunteer's password. The volunteer will receive an e-mail
 * with a password reset link to re-gain access to their account.
 */
function PasswordResetDialog(props: DialogProps) {
    const { account, onClose, open } = props;

    const [ link, setLink ] = useState<string>();
    const [ loading, setLoading ] = useState(false);

    const handleClose = useCallback(() => onClose(/* refresh= */ !!link), [ onClose, link ]);
    const handleRequest = useCallback(async() => {
        setLoading(true);
        try {
            const response = await issueServerAction<ResetPasswordLinkDefinition>(
                '/api/admin/reset-password-link',
                { userId: account.userId });

            if (response.link)
                setLink(response.link);

        } finally {
            setLoading(false);
        }
    }, [ account ]);

    return (
        <Dialog open={!!open} onClose={handleClose} fullWidth>
            <DialogTitle>
                Request a password reset
            </DialogTitle>
            <DialogContent>
                <Typography>
                    You can request a password reset link for <strong>{account.firstName} </strong>
                    using which they can immediately reset their password. The link is yours to
                    share with them.
                </Typography>
                <Collapse in={!!link}>
                    <Stack direction="row" spacing={2} sx={kStyles.success} alignItems="center">
                        <SecurityIcon fontSize="small" />
                        <TextField variant="standard" margin="dense" fullWidth value={link} />
                    </Stack>
                </Collapse>
            </DialogContent>
            <DialogActions sx={{ pt: 0, mr: 2, mb: 2 }}>
                <Button onClick={handleClose} variant="text">Cancel</Button>
                <LoadingButton disabled={!!link} loading={loading} onClick={handleRequest}
                               variant="contained">
                    Continue
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
}

/**
 * Props accepted by the <Header> component.
 */
export interface HeaderProps {
    /**
     * Information about the account of the volunteer for whom the header is shown.
     */
    account: VolunteerInfo['account'];

    /**
     * Whether the signed in user is an administrator.
     */
    isAdmin: boolean;
}

/**
 * The <Header> component provides access to the volunteer's primary identity and quick access
 * related to the workings of their account, for example to (de)activate them or request a new
 * passport or access code.
 */
export function Header(props: HeaderProps) {
    const { account, isAdmin } = props;

    const [ accessCodeOpen, setAccessCodeOpen ] = useState(false);
    const [ activateOpen, setActivateOpen ] = useState(false);
    const [ deactivateOpen, setDeactivateOpen ] = useState(false);
    const [ resetOpen, setResetOpen ] = useState(false);

    const router = useRouter();

    function requestClose(refreshState?: boolean) {
        if (refreshState)
            router.refresh();

        if (accessCodeOpen)
            setAccessCodeOpen(false);
        if (activateOpen)
            setActivateOpen(false);
        if (deactivateOpen)
            setDeactivateOpen(false);
        if (resetOpen)
            setResetOpen(false);
    }

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5">
                {account.firstName} {account.lastName}
            </Typography>
            <Stack sx={kStyles.options} divider={ <Divider orientation="vertical" flexItem /> }
                   direction="row" spacing={1}>

                { account.activated &&
                    <Button variant="text" startIcon={ <UnpublishedIcon /> }
                            onClick={ () => setDeactivateOpen(true) }>
                        Deactivate
                    </Button> }

                { !account.activated &&
                    <Button variant="text" startIcon={ <CheckCircleIcon /> }
                            onClick={ () => setActivateOpen(true) }>
                        Activate
                    </Button> }

                { isAdmin &&
                    <Button variant="text" startIcon={ <LockResetIcon /> }
                            onClick={ () => setResetOpen(true) }>
                        Reset password
                    </Button> }

                <Button variant="text" startIcon={ <PinIcon /> }
                        onClick={ () => setAccessCodeOpen(true) }>
                    Access code
                </Button>

            </Stack>

            <AccessCodeDialog account={account} open={accessCodeOpen} onClose={requestClose} />
            <ActivateDialog account={account} open={activateOpen} onClose={requestClose} />
            <DeactivateDialog account={account} open={deactivateOpen} onClose={requestClose} />
            <PasswordResetDialog account={account} open={resetOpen} onClose={requestClose} />

        </Paper>
    );
}

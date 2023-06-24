// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Link from 'next/link';
import { useCallback, useState } from 'react';

import { type FieldValues, FormContainer, TextFieldElement } from 'react-hook-form-mui';

import type { SxProps, Theme } from '@mui/system';
import { default as MuiLink } from '@mui/material/Link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import LoadingButton from '@mui/lab/LoadingButton';

/**
 * Styles used by the various components that make up the authentication flow.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    formElements: { paddingTop: 2 },

    root: {
        '& .MuiDialogActions-spacing': {
            padding: 2,
            paddingRight: 3,  // for alignment with the input fields...
            paddingTop: 0,
        },
    },
};

/**
 * Progress in the authentication flow, influenced by the user's actions.
 */
type AuthenticationFlowState =
    // (1) Default state: The user has to enter their username.
    'username' |

    // (2a) There exists a user with the given username that has passkey credentials.
    // TODO

    // (2b) There exists a user with the given username, but no passkey credentials.
    'login-password' |

    // (2c) There does not exist a user with the given username.
    'register';

/**
 * Props accepted by the <UsernameDialog> component.
 */
interface UsernameDialogProps {
    /**
     * To be invoked when the form should be closed, e.g. by being cancelled.
     */
    onClose: () => void;

    /**
     * To be invoked when the username dialog has been submitted for the given `username`.
     */
    onSubmit: (username: string) => Promise<void>;
}

/**
 * Prompts the user for their username, which usually will be their e-mail address. Accepts both
 * submission and cancellation of the flow through the dialog's action buttons.
 */
function UsernameDialog(props: UsernameDialogProps) {
    const { onClose, onSubmit } = props;

    const [ error, setError ] = useState<string | undefined>();
    const [ loading, setLoading ] = useState<boolean>(false);

    async function requestSubmit(data: FieldValues) {
        setError(undefined);
        setLoading(true);

        try {
            await onSubmit(data.username);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <FormContainer onSuccess={requestSubmit}>
            <DialogTitle>Hello there!</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Please enter your e-mail address to identify yourself with the AnimeCon
                    volunteer portal, even if you're just about to sign up.
                </DialogContentText>
                <Collapse in={!!error}>
                    <DialogContentText sx={{ paddingTop: 1 }} color="error">
                        {error}&nbsp;
                    </DialogContentText>
                </Collapse>
                <Box sx={kStyles.formElements}>
                    <TextFieldElement name="username" label="E-mail" type="email"
                                      fullWidth size="small" required
                                      autoComplete="username" />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <LoadingButton loading={loading} type="submit" variant="contained">
                    Proceed
                </LoadingButton>
            </DialogActions>
        </FormContainer>
    );
}

/**
 * Props accepted by the <LoginPasswordDialog> component.
 */
interface LoginPasswordDialogProps {
    /**
     * To be invoked when the form should be closed, e.g. by being cancelled.
     */
    onClose: () => void;

    /**
     * To be invoked when the user has lost their password and wants to request a new one.
     */
    onLostPassword: () => void;

    /**
     * To be invoked when the dialog has been submitted for the given `password`.
     */
    onSubmit: (password: string) => Promise<void>;
}

/**
 * The <LoginPasswordDialog> component allows users to sign in to their account. They will be asked
 * to enter their password, which, when verified by the server, will sign them in to their account.
 */
function LoginPasswordDialog(props: LoginPasswordDialogProps) {
    const { onClose, onLostPassword, onSubmit } = props;

    const [ error, setError ] = useState<string | undefined>();
    const [ loading, setLoading ] = useState<boolean>(false);

    async function requestSubmit(data: FieldValues) {
        setError(undefined);
        setLoading(true);

        try {
            await onSubmit(data.username);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <FormContainer>
            <DialogTitle>Sign in</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Please enter your password to sign in to your account, or&nbsp;
                    <MuiLink component={Link} href="#" onClick={onLostPassword}>reset
                    your password</MuiLink> in case you lost it.
                </DialogContentText>
                <Collapse in={!!error}>
                    <DialogContentText sx={{ paddingTop: 1 }} color="error">
                        {error}&nbsp;
                    </DialogContentText>
                </Collapse>
                <Box sx={kStyles.formElements}>
                    <TextFieldElement name="password" label="Password" type="password"
                                      fullWidth size="small" required
                                      autoComplete="current-password" />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <LoadingButton loading={loading} type="submit" variant="contained">
                    Sign in
                </LoadingButton>
            </DialogActions>
        </FormContainer>
    );
}

/**
 * Props accepted by the <RegisterDialog> component.
 */
interface RegisterDialogProps {
    /**
     * To be invoked when the form should be closed, e.g. by being cancelled.
     */
    onClose: () => void;
}

/**
 * The <RegisterDialog> dialog allows users to create a new account. They will be prompted for their
 * personal information, after which an account will be created for them.
 */
function RegisterDialog(props: RegisterDialogProps) {
    return (
        <FormContainer>
            <DialogTitle>Create an account</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Please fill in the following details in order to create an account, which will
                    allow you to apply as a volunteer to one of the AnimeCon festivals.
                </DialogContentText>
            </DialogContent>
        </FormContainer>
    );
}

/**
 * Props accepted by the <AuthenticationFlow> component.
 */
export interface AuthenticationFlowProps {
    /**
     * Callback that will be invoked when the authorization flow should be closed.
     */
    onClose: () => void;

    /**
     * Whether the authorization flow should be opened.
     */
    open?: boolean;
}

/**
 * The <AuthenticationFlow> component provides an inline, modal-dialog based flow that allows users
 * to identify themselves in the volunteer manager.
 *
 * TODO: Support identification using access codes
 * TODO: Support identification using passwords
 * TODO: Support identification using passkeys
 * TODO: Support registration
 * TODO: Support lost password requests
 */
export function AuthenticationFlow(props: AuthenticationFlowProps) {
    const { onClose, open } = props;

    const [ authFlowState, setAuthFlowState ] = useState<AuthenticationFlowState>('username');
    const [ username, setUsername ] = useState<string>();

    // Supporting callbacks for any state:
    const onRequestClose = useCallback(() => {
        setAuthFlowState('username');
        onClose();

    }, [ onClose ]);

    // Supporting callbacks for the 'username' state:
    const onSubmitUsername = useCallback(async username => {
        let responseData: Record<string, any>;
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });

            responseData = await response.json();

        } catch {
            throw new Error('The server ran into an issue, please try again later.');
        }

        setUsername(username);

        if (responseData.success)
            setAuthFlowState('login-password');
        else
            setAuthFlowState('register');

    }, []);

    // Supporting callbacks for the 'login-password' state:
    const onLostPassword = useCallback(async () => {

    }, []);

    const onSubmitPassword = useCallback(async password => {
        let responseData: Record<string, any>;
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            responseData = await response.json();

        } catch {
            throw new Error('The server ran into an issue, please try again later.');
        }

        if (!responseData.success)
            throw new Error('That is not the password we\'ve got on file. Try again?');

        onRequestClose();

    }, []);

    return (
        <Dialog open={open} onClose={onRequestClose} sx={kStyles.root}>
            { authFlowState === 'username' &&
                <UsernameDialog onClose={onRequestClose}
                                onSubmit={onSubmitUsername} /> }
            { authFlowState === 'login-password' &&
                <LoginPasswordDialog onClose={onRequestClose}
                                     onLostPassword={onLostPassword}
                                     onSubmit={onSubmitPassword} /> }
            { authFlowState === 'register' &&
                <RegisterDialog onClose={onRequestClose} /> }
        </Dialog>
    );
}

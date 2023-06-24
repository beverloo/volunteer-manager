// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { useCallback, useState } from 'react';

import type { SxProps, Theme } from '@mui/system';
import Dialog from '@mui/material/Dialog';

import type { UserData } from '../lib/auth/UserData';
import { IdentityDialog } from './authentication/IdentityDialog';
import { LoginPasswordDialog } from './authentication/LoginPasswordDialog';
import { RegisterDialog } from './authentication/RegisterDialog';
import { UsernameDialog } from './authentication/UsernameDialog';
import { issueAuthenticationRequest } from './AuthenticationRequest';

/**
 * Styles used by the various components that make up the authentication flow.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
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
    'register' |

    // (3) The user is signed in to their account already, and can sign out.
    'identity';

/**
 * Props accepted by the <AuthenticationFlow> component.
 */
interface AuthenticationFlowProps {
    /**
     * Callback that will be invoked when the authorization flow should be closed.
     */
    onClose: () => void;

    /**
     * Whether the authorization flow should be opened.
     */
    open?: boolean;

    /**
     * Information about the signed in user, when they already are signed in to an account.
     */
    user?: UserData;
}

/**
 * The <AuthenticationFlow> component provides an inline, modal-dialog based flow that allows users
 * to identify themselves in the volunteer manager.
 *
 * TODO: Support identification using access codes
 * TODO: Support identification using passkeys
 * TODO: Support registration
 * TODO: Support lost password requests
 */
export function AuthenticationFlow(props: AuthenticationFlowProps) {
    const { onClose, open, user } = props;

    // The initial state of the authentication flow depends on whether |user| is set. If so, they
    // are signed in to their account and we should display the associated information. If not, we
    // should enable them to either sign-in to or register for an account.
    const initialState: AuthenticationFlowState = user ? 'identity' : 'username';

    const [ authFlowState, setAuthFlowState ] = useState<AuthenticationFlowState>(initialState);
    const [ username, setUsername ] = useState<string>();

    // Supporting callbacks for any state:
    const onRequestClose = useCallback(() => {
        setAuthFlowState('username');
        onClose();

    }, [ onClose ]);

    // Supporting callbacks for the 'username' state:
    const onSubmitUsername = useCallback(async username => {
        const response = await issueAuthenticationRequest({ username });

        setUsername(username);

        if (response.success)
            setAuthFlowState('login-password');
        else
            setAuthFlowState('register');

    }, []);

    // Supporting callbacks for the 'login-password' state:
    const onLostPassword = useCallback(async () => {

    }, []);

    const onSubmitPassword = useCallback(async password => {
        const passwordBuffer = new TextEncoder().encode(password);
        const passwordHashedBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer);

        const hashedPassword = [ ...new Uint8Array(passwordHashedBuffer) ]
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');

        const response = await issueAuthenticationRequest({ username, password: hashedPassword });
        if (!response.success)
            throw new Error('That is not the password we\'ve got on file. Try again?');

        if (typeof document !== 'undefined')
            document.location.reload();
        else
            onRequestClose();

    }, [ onRequestClose, username ]);

    // Supporting callbacks for the 'identity' state:
    const onRequestSignOut = useCallback(async () => {
        await issueAuthenticationRequest({ action: 'sign-out' });

        if (typeof document !== 'undefined')
            document.location.reload();
        else
            onRequestClose();

    }, [ onRequestClose ]);

    return (
        <Dialog open={open} onClose={onRequestClose} sx={kStyles.root} fullWidth>
            { authFlowState === 'username' &&
                <UsernameDialog onClose={onRequestClose}
                                onSubmit={onSubmitUsername} /> }
            { authFlowState === 'login-password' &&
                <LoginPasswordDialog onClose={onRequestClose}
                                     onLostPassword={onLostPassword}
                                     onSubmit={onSubmitPassword} /> }
            { authFlowState === 'register' &&
                <RegisterDialog onClose={onRequestClose} /> }
            { authFlowState === 'identity' &&
                <IdentityDialog onClose={onRequestClose}
                                onSignOut={onRequestSignOut}
                                user={user} /> }
        </Dialog>
    );
}

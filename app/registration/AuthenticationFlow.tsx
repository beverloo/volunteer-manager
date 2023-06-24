// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { useCallback, useState } from 'react';

import type { SxProps, Theme } from '@mui/system';
import Dialog from '@mui/material/Dialog';

import type { UserData } from '@lib/auth/UserData';
import { IdentityDialog } from './authentication/IdentityDialog';
import { LoginPasswordDialog } from './authentication/LoginPasswordDialog';
import { LostPasswordDialog } from './authentication/LostPasswordDialog';
import { LostPasswordResetDialog } from './authentication/LostPasswordResetDialog';
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
 * Verifies that our password safety requirements are met by `password`. We're not super strict, but
 * do require a sensible baseline of security:
 *
 * - At least eight characters in length,
 * - At least one lowercase character,
 * - At least one uppercase character.
 *
 * Further verification is necessary for statistics and the administration area, but access to those
 * is limited to accounts that use passkeys instead, which are much more secure.
 */
function VerifyPasswordRequirements(password: string) {
    const requiredLength = password.length >= 8;
    const requiredLowercaseCharacter = /[a-z]/.test(password);
    const requiredUppercaseCharacter = /[A-Z]/.test(password);

    if (!requiredLength || !requiredLowercaseCharacter || !requiredUppercaseCharacter) {
        throw new Error(
            'Your password must be at least 8 characters long, contain at least one lowercase ' +
            'character, as well as at least one uppercase character.');
    }
}

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

    // (2c) There exists a user with the given username, but the user has lost their credentials.
    'lost-password' | 'lost-password-reset' |

    // (2d) There does not exist a user with the given username.
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
     * The password reset request for which the authentication flow should continue. Normally
     * injected in the page through URL parameters, but we really don't care.
     */
    passwordResetRequest?: string;

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
 */
export function AuthenticationFlow(props: AuthenticationFlowProps) {
    const { onClose, open, passwordResetRequest, user } = props;

    // The initial state of the authentication flow depends on whether |user| is set. If so, they
    // are signed in to their account and we should display the associated information. If not, we
    // should enable them to either sign-in to or register for an account.
    const initialState: AuthenticationFlowState =
        user ? 'identity'
             : (passwordResetRequest ? 'lost-password-reset'
                                     : 'username');

    const [ authFlowState, setAuthFlowState ] = useState<AuthenticationFlowState>(initialState);
    const [ username, setUsername ] = useState<string>();

    // ---------------------------------------------------------------------------------------------
    // Supporting callbacks for any state:
    // ---------------------------------------------------------------------------------------------
    const onRequestClose = useCallback(() => {
        // Reset the authentication flow state back to the initial state, but don't rely on the
        // `initialState` member in case the flow included a sign in or sign out operation.
        setTimeout(() => setAuthFlowState(user ? 'identity' : 'username'), 500);
        onClose();

    }, [ onClose, user ]);

    // ---------------------------------------------------------------------------------------------
    // Supporting callbacks for the 'username' state:
    // ---------------------------------------------------------------------------------------------
    const onSubmitUsername = useCallback(async username => {
        const response = await issueAuthenticationRequest({ action: 'confirm-identity', username });

        setUsername(username);

        if (response.success)
            setAuthFlowState('login-password');
        else
            setAuthFlowState('register');

    }, []);

    // ---------------------------------------------------------------------------------------------
    // Supporting callbacks for the 'login-password' state:
    // ---------------------------------------------------------------------------------------------
    const onLostPassword = useCallback(() => setAuthFlowState('lost-password'), [ /* no deps */ ]);

    const onSubmitPassword = useCallback(async password => {
        const passwordBuffer = new TextEncoder().encode(password);
        const passwordHashedBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer);

        const hashedPassword = [ ...new Uint8Array(passwordHashedBuffer) ]
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');

        const response = await issueAuthenticationRequest({
            action: 'sign-in-password',
            username,
            password: hashedPassword
        });

        if (!response.success)
            throw new Error('That is not the password we\'ve got on file. Try again?');

        typeof document !== 'undefined' ? document.location.reload()
                                        : onRequestClose();

    }, [ onRequestClose, username ]);

    // ---------------------------------------------------------------------------------------------
    // Supporting callbacks for the 'lost-password' and 'lost-password-reset' states:
    // ---------------------------------------------------------------------------------------------
    const onRequestPasswordReset = useCallback(async () => {
        const response = await issueAuthenticationRequest({
            action: 'password-reset-request',
            username
        });

        return response.success;

    }, [ username ]);

    const onPasswordReset = useCallback(async (request: string, password: string) => {
        VerifyPasswordRequirements(password);

        await new Promise(resolve => setTimeout(resolve, 1500));

    }, [ /* no deps */ ]);


    // ---------------------------------------------------------------------------------------------
    // Supporting callbacks for the 'identity' state:
    // ---------------------------------------------------------------------------------------------
    const onRequestSignOut = useCallback(async () => {
        await issueAuthenticationRequest({ action: 'sign-out' });

        typeof document !== 'undefined' ? document.location.reload()
                                        : onRequestClose();

    }, [ onRequestClose ]);

    // ---------------------------------------------------------------------------------------------

    return (
        <Dialog open={open} onClose={onRequestClose} sx={kStyles.root} fullWidth>
            { authFlowState === 'username' &&
                <UsernameDialog onClose={onRequestClose}
                                onSubmit={onSubmitUsername} /> }
            { authFlowState === 'login-password' &&
                <LoginPasswordDialog onClose={onRequestClose}
                                     onLostPassword={onLostPassword}
                                     onSubmit={onSubmitPassword} /> }
            { authFlowState === 'lost-password' &&
                <LostPasswordDialog onClose={onRequestClose}
                                    onRequestPasswordReset={onRequestPasswordReset} /> }
            { authFlowState === 'lost-password-reset' &&
                <LostPasswordResetDialog onClose={onRequestClose}
                                         onPasswordReset={onPasswordReset}
                                         passwordResetRequest={passwordResetRequest} /> }
            { authFlowState === 'register' &&
                <RegisterDialog onClose={onRequestClose} /> }
            { authFlowState === 'identity' &&
                <IdentityDialog onClose={onRequestClose}
                                onSignOut={onRequestSignOut}
                                user={user} /> }
        </Dialog>
    );
}

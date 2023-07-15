// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { SxProps, Theme } from '@mui/system';
import Dialog from '@mui/material/Dialog';

import type { UserData } from '@lib/auth/UserData';
import { IdentityDialog } from './authentication/IdentityDialog';
import { LoginPasswordDialog } from './authentication/LoginPasswordDialog';
import { LoginPasswordUpdateDialog } from './authentication/LoginPasswordUpdateDialog';
import { LostPasswordCompleteDialog } from './authentication/LostPasswordCompleteDialog';
import { LostPasswordDialog } from './authentication/LostPasswordDialog';
import { LostPasswordResetDialog } from './authentication/LostPasswordResetDialog';
import { RegisterDialog, type PartialRegistrationRequest } from './authentication/RegisterDialog';
import { RegisterConfirmDialog } from './authentication/RegisterConfirmDialog';
import { UsernameDialog } from './authentication/UsernameDialog';
import { validatePassword } from './authentication/PasswordField';

import type { ConfirmIdentityDefinition } from '@app/api/auth/confirmIdentity';
import type { PasswordResetDefinition } from '@app/api/auth/passwordReset';
import type { PasswordResetRequestDefinition } from '@app/api/auth/passwordResetRequest';
import type { RegisterDefinition } from '@app/api/auth/register';
import type { SignInPasswordDefinition } from '@app/api/auth/signInPassword';
import type { SignInPasswordUpdateDefinition } from '@app/api/auth/signInPasswordUpdate';
import type { SignOutDefinition } from '@app/api/auth/signOut';

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
 * Creates a SHA256 hash of the given |password|, the result of which will be 64 characters in
 * length. This is done client side as we don't want to transmit plaintext passwords at all.
 */
async function SHA256HashPassword(password: string): Promise<string> {
    const passwordBuffer = new TextEncoder().encode(password);
    const passwordHashedBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer);

    return [ ...new Uint8Array(passwordHashedBuffer) ]
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

type ServerCallDefinition = { request: object; response: object; };

/**
 * Issues a call to the server at the given `endpoint` with the given `request` information. When
 * successful, will return an object conforming to the response type, or otherwise throw an Error
 * that should be caught by the user interface.
 *
 * @param endpoint The endpoint to which the call should be made.
 * @param request Request information that should be included in the request.
 * @returns Response from the server, unverified but assumed to be correct for now.
 */
export async function issueServerAction<T extends ServerCallDefinition>(
    endpoint: string, request: T['request'])
        : Promise<T['response']>
{
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });

        return await response.json();

    } catch {
        throw new Error('The server ran into an issue, please try again later.');
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
    'login-password' | 'login-password-update' |

    // (2c) There exists a user with the given username, but the user has lost their credentials.
    'lost-password' | 'lost-password-reset' | 'lost-password-complete' |

    // (2d) There does not exist a user with the given username.
    'register' | 'register-confirm' |

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

    // TODO: `registrationConfirmationRequest`

    /**
     * Optional URL to which the user should be redirected after they have created and confirmed an
     * account. Confirmation often happens in a new tab, where we want to continue the flow.
     */
    registrationRedirectUrl?: string;

    /**
     * Information about the signed in user, when they already are signed in to an account.
     */
    user?: UserData;
}

/**
 * The <AuthenticationFlow> component provides an inline, modal-dialog based flow that allows users
 * to identify themselves in the volunteer manager. This is a complex component that supports about
 * a dozen states:
 *
 * - Identification using access codes, followed by a forced password reset,
 * - Identification using passwords,
 * - Recovery of lost passwords, including a password reset,
 * - Registration of new accounts, including verification of their e-mail address.
 *
 * Any passwords entered during the authentication flow will be hashed using SHA-256 prior to being
 * send to the server. The server will apply an additional hash over the password prior to storing
 * it, to make sure that the hashes cannot be reversed.
 *
 * TODO: Support identification using passkeys
 */
export function AuthenticationFlow(props: AuthenticationFlowProps) {
    const { onClose, open, passwordResetRequest, registrationRedirectUrl, user } = props;

    // Used to refresh the app context following authentication changes.
    const router = useRouter();

    // The initial state of the authentication flow depends on whether |user| is set. If so, they
    // are signed in to their account and we should display the associated information. If not, we
    // should enable them to either sign-in to or register for an account.
    const initialState: AuthenticationFlowState =
        user ? 'identity'
             : (passwordResetRequest ? 'lost-password-reset'
                                     : 'username');

    const [ authFlowState, setAuthFlowState ] = useState<AuthenticationFlowState>(initialState);
    const [ passwordUpdateToken, setPasswordUpdateToken ] = useState<string>();

    const [ firstName, setFirstName ] = useState<string>();
    const [ username, setUsername ] = useState<string>();

    // ---------------------------------------------------------------------------------------------
    // Supporting callbacks for any state:
    // ---------------------------------------------------------------------------------------------
    const onRequestClose = useCallback((forceState?: AuthenticationFlowState) => {
        // Reset the authentication flow state back to the initial state, but don't rely on the
        // `initialState` member in case the flow included a sign in or sign out operation.
        const newState = typeof forceState === 'string' ? forceState
                                                        : (user ? 'identity' : 'username');

        setTimeout(() => setAuthFlowState(newState), 500);
        onClose();

    }, [ onClose, user ]);

    // ---------------------------------------------------------------------------------------------
    // Supporting callbacks for the 'username' state:
    // ---------------------------------------------------------------------------------------------
    const onSubmitUsername = useCallback(async (username: string) => {
        const response = await issueServerAction<ConfirmIdentityDefinition>(
            '/api/auth/confirm-identity', { username });

        setUsername(username);

        if (response.success)
            setAuthFlowState('login-password');
        else
            setAuthFlowState('register');

    }, []);

    // ---------------------------------------------------------------------------------------------
    // Supporting callbacks for the 'login-password' and 'login-password-update' state:
    // ---------------------------------------------------------------------------------------------
    const onLostPassword = useCallback(() => setAuthFlowState('lost-password'), [ /* no deps */ ]);

    const onSubmitPassword = useCallback(async (plaintextPassword: string) => {
        const response = await issueServerAction<SignInPasswordDefinition>(
            '/api/auth/sign-in-password', {
                username: username!,
                password: await SHA256HashPassword(plaintextPassword),
            });

        if (!response.success)
            throw new Error('That is not the password we\'ve got on file. Try again?');

        // The server can require the user to update their password, in which case they will not be
        // logged in just yet. Advance them to the update page when this is the case.
        if (response.requiredPasswordUpdateToken) {
            setPasswordUpdateToken(response.requiredPasswordUpdateToken);
            setAuthFlowState('login-password-update');
            return;
        }

        router.refresh();
        onRequestClose(/* forceState= */ 'identity');

    }, [ onRequestClose, router, username ]);

    const onSubmitUpdatePassword = useCallback(async (plaintextPassword: string) => {
        const response = await issueServerAction<SignInPasswordUpdateDefinition>(
            '/api/auth/sign-in-password-update', {
                username: username!,
                password: await SHA256HashPassword(plaintextPassword),
                passwordResetRequest: passwordUpdateToken!,
            });

        if (!response.success)
            throw new Error('Your password could not be updated. Try again?');

        router.refresh();
        onRequestClose(/* forceState= */ 'identity');

    }, [ onRequestClose, passwordUpdateToken, router, username ]);

    // ---------------------------------------------------------------------------------------------
    // Supporting callbacks for the 'lost-password' and 'lost-password-reset' states:
    // ---------------------------------------------------------------------------------------------
    const onRequestPasswordReset = useCallback(async () => {
        const response = await issueServerAction<PasswordResetRequestDefinition>(
            '/api/auth/password-reset-request', { username: username! });

        return response.success;

    }, [ username ]);

    const onPasswordReset = useCallback(async (request: string, plaintextPassword: string) => {
        validatePassword(plaintextPassword, /* throwOnFailure= */ true);

        const response = await issueServerAction<PasswordResetDefinition>(
            '/api/auth/password-reset', {
                password: await SHA256HashPassword(plaintextPassword),
                request,
            });

        return response.success;

    }, [ /* no deps */ ]);

    // ---------------------------------------------------------------------------------------------
    // Supporting callbacks for the 'register' state:
    // ---------------------------------------------------------------------------------------------
    const onRegistrationRequest
        = useCallback(async (plaintextPassword: string, request: PartialRegistrationRequest) =>
        {
            validatePassword(plaintextPassword, /* throwOnFailure= */ true);
            const response = await issueServerAction<RegisterDefinition>('/api/auth/register', {
                ...request,

                username: username!,
                password: await SHA256HashPassword(plaintextPassword),

                // The URL the user should be redirected to after confirming their e-mail address.
                redirectUrl: registrationRedirectUrl,
            });

            if (!response.success)
                throw new Error('The server was not able to create an account.');

            setAuthFlowState('register-confirm');
            setFirstName(request.firstName);

        }, [ registrationRedirectUrl, username ]);

    // ---------------------------------------------------------------------------------------------
    // Supporting callbacks for the 'identity' state:
    // ---------------------------------------------------------------------------------------------
    const onRequestSignOut = useCallback(async () => {
        await issueServerAction<SignOutDefinition>('/api/auth/sign-out', { /* no parameters */ });

        router.refresh();
        onRequestClose(/* forceState= */ 'username');

    }, [ onRequestClose, router ]);

    // ---------------------------------------------------------------------------------------------

    return (
        <Dialog open={!!open} onClose={() => onRequestClose()} sx={kStyles.root} fullWidth>
            { authFlowState === 'username' &&
                <UsernameDialog onClose={onRequestClose}
                                onSubmit={onSubmitUsername} /> }
            { authFlowState === 'login-password' &&
                <LoginPasswordDialog onClose={onRequestClose}
                                     onLostPassword={onLostPassword}
                                     onSubmit={onSubmitPassword} /> }
            { (authFlowState === 'login-password-update' && passwordUpdateToken) &&
                <LoginPasswordUpdateDialog onClose={onRequestClose}
                                           onSubmit={onSubmitUpdatePassword} /> }
            { authFlowState === 'lost-password' &&
                <LostPasswordDialog onClose={onRequestClose}
                                    onRequestPasswordReset={onRequestPasswordReset} /> }
            { (authFlowState === 'lost-password-reset' && passwordResetRequest) &&
                <LostPasswordResetDialog onClose={onRequestClose}
                                         onPasswordReset={onPasswordReset}
                                         passwordResetRequest={passwordResetRequest} /> }
            { authFlowState === 'lost-password-complete' &&
                <LostPasswordCompleteDialog /> }
            { authFlowState === 'register' &&
                <RegisterDialog onClose={onRequestClose}
                                onSubmit={onRegistrationRequest} /> }
            { (authFlowState === 'register-confirm' && firstName) &&
                <RegisterConfirmDialog onClose={onRequestClose}
                                       firstName={firstName} /> }
            { (authFlowState === 'identity' && user) &&
                <IdentityDialog onClose={onRequestClose}
                                onSignOut={onRequestSignOut}
                                user={user} /> }
        </Dialog>
    );
}

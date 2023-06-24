// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Request format for an API call to the authentication endpoint requesting someone's identity.
 */
export interface ConfirmIdentityRequest {
    /**
     * The "action" must be set to confirm-identity.
     */
    action: 'confirm-identity';

    /**
     * The username for whom the associated identity should be found.
     */
    username: string;
}

/**
 * Response format from an API call to the authentication endpoint carrying someone's identity.
 */
export interface ConfirmIdentityResponse {
    /**
     * Whether the identify for the requested user could be found.
     */
    success: boolean;

    // TODO: WebAuthn information.
}

/**
 * API request that should be issued when the user has gone through the password reset flow, clicked
 * on the link in their e-mail and chose a valid new password. Now we only need to store it.
 */
export interface PasswordResetRequest {
    /**
     * The "action" must be set to password-reset.
     */
    action: 'password-reset';

    /**
     * The new password that the user would like to store. Must already be sha256 hashed.
     */
    password: string;

    /**
     * The sealed password reset request that the server should consider.
     */
    request: string;
}

/**
 * Response from the server when the password reset sequence has been completed. There still are
 * timing and verification issues that can happen, so success cannot be assumed.
 */
export interface PasswordResetResponse {
    /**
     * Whether the password was successfully reset.
     */
    success: boolean;
}

/**
 * Request format for an API call to the authentication endpoint requesting a password reset.
 */
export interface PasswordResetRequestRequest {
    /**
     * The "action" must be set to password-reset-request.
     */
    action: 'password-reset-request';

    /**
     * The username of the account whose password has been lost.
     */
    username: string;
}

/**
 * Response format from an API call to the authentication endpoint attempting a password reset.
 */
export interface PasswordResetRequestResponse {
    /**
     * Whether instructions to reset their password were sent to their e-mail address.
     */
    success: boolean;
}

/**
 * Request format for an API call to the authentication endpoint requesting a password reset.
 */
export interface PasswordResetVerifyRequest {
    /**
     * The "action" must be set to password-reset-verify.
     */
    action: 'password-reset-verify';

    /**
     * The sealed password reset request that the server should verify.
     */
    request: string;
}

/**
 * Response format from an API call to the authentication endpoint attempting a password reset.
 */
export interface PasswordResetVerifyResponse {
    /**
     * Whether the password reset token could be successfully verified.
     */
    success: boolean;

    /**
     * The first name of the user whose information is being reset when successful.
     */
    firstName?: string;
}

/**
 * Request format for an API call to the authentication endpoint requesting a sign in.
 */
export interface SignInPasswordRequest {
    /**
     * The "action" must be set to sign-in-password.
     */
    action: 'sign-in-password';

    /**
     * The username whom is attempting to sign in to their account.
     */
    username: string;

    /**
     * The password associated with that account, SHA256 hashed.
     */
    password: string;
}

/**
 * Response format from an API call to the authentication endpoint attempting a sign in.
 */
export interface SignInPasswordResponse {
    /**
     * Whether the sign in attempt was successful.
     */
    success: boolean;
}

/**
 * Request format for an API call to the authentication endpoint requesting a sign out.
 */
export interface SignOutRequest {
    /**
     * The "action" must be set to sign-out.
     */
    action: 'sign-out';
}

/**
 * Response format from an API call to the authentication endpoint attempting a sign out.
 */
export interface SignOutResponse { /* no values */ }

/**
 * All valid interfaces for requests, used for the `issueAuthenticationRequest` implementation.
 */
type RequestTypes =
    ConfirmIdentityRequest | PasswordResetRequest | PasswordResetRequestRequest |
    PasswordResetVerifyRequest | SignInPasswordRequest | SignOutRequest;

/**
 * All valid interfaces for responses, used for the `issueAuthenticationRequest` implementation.
 */
type ResponseTypes =
    ConfirmIdentityResponse | PasswordResetResponse | PasswordResetRequestResponse |
    PasswordResetVerifyResponse | SignInPasswordResponse | SignOutResponse;

/**
 * Issues an authentication request to validate whether the username in `request` has a known
 * account. If so, the associated credential identity will be returned, allowing the user to sign in
 * using either their passkey or with their password.
 *
 * @param request The `{ username }` for whom the identity should be checked.
 * @returns Whether there is a user with this identity, and if so, their credential identities.
 */
export async function issueAuthenticationRequest(request: ConfirmIdentityRequest)
        : Promise<ConfirmIdentityResponse>;

/**
 * Issues an authentication request with the intention to instate a new password for the user. This
 * call must be made at the very end of the password verification flow. The response, when
 * successful, will include a Set-Cookie header to automatically sign the user back in.
 *
 * @param request The request and new password through the lost password flow.
 * @returns Whether the updated password has been saved.
 */
export async function issueAuthenticationRequest(request: PasswordResetRequest)
        : Promise<PasswordResetResponse>;

/**
 * Issues an authentication request to reset the password of the user contained within the `request`
 *
 * @param request The `{ username }` for whom a password reset should be requested.
 * @returns Whether the password reset instructions were e-mailed.
 */
export async function issueAuthenticationRequest(request: PasswordResetRequestRequest)
        : Promise<PasswordResetRequestResponse>;


/**
 * Verifies the validity of a password reset token with the server, and obtains the requester's
 * first name in order to personalize the continuation of the password reset flow.
 *
 * @param request The sealed password reset request information that should be verified.
 * @returns Whether the request is valid, and the requester's first name.
 */
export async function issueAuthenticationRequest(request: PasswordResetVerifyRequest)
        : Promise<PasswordResetVerifyResponse>;

/**
 * Issues an authentication request to sign in the username and password in `request`. When this
 * is successful, a response will be returned that carries the identity cookie.
 *
 * @param request The `{ username, password }` for whom a sign in should be attempted.
 * @returns Whether the sign in attempt was successful.
 */
export async function issueAuthenticationRequest(request: SignInPasswordRequest)
        : Promise<SignInPasswordResponse>;

/**
 * Issues an authentication request to sign out from the account that's currently signed in. This
 * involves HTTP-only cookies that should be destroyed by the server.
 *
 * @param request The action that the server is requested to take.
 * @response Nothing of use.
 */
export async function issueAuthenticationRequest(request: SignOutRequest): Promise<SignOutResponse>;

/**
 * Implementation of the various `issueAuthenticationRequest` overloads.
 * @ignore
 */
export async function issueAuthenticationRequest(request: RequestTypes): Promise<ResponseTypes> {
    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });

        return await response.json();

    } catch {
        throw new Error('The server ran into an issue, please try again later.');
    }
}

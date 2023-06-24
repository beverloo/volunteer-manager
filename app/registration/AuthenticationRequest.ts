// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Request format for an API call to the authentication endpoint requesting someone's identity.
 */
export interface IdentityRequest {
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
export interface IdentityResponse {
    /**
     * Whether the identify for the requested user could be found.
     */
    success: boolean;

    // TODO: WebAuthn information.
}

/**
 * Request format for an API call to the authentication endpoint requesting a sign in.
 */
export interface PasswordLoginRequest {
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
export interface PasswordLoginResponse {
    /**
     * Whether the sign in attempt was successful.
     */
    success: boolean;
}

/**
 * Request format for an API call to the authentication endpoint requesting a password reset.
 */
export interface PasswordLostRequest {
    /**
     * The "action" must be set to password-reset.
     */
    action: 'password-reset';

    /**
     * The username of the account whose password has been lost.
     */
    username: string;
}

/**
 * Response format from an API call to the authentication endpoint attempting a password reset.
 */
export interface PasswordLostResponse {
    /**
     * Whether instructions to reset their password were sent to their e-mail address.
     */
    success: boolean;
}

/**
 * Request format for an API call to the authentication endpoint requesting a password reset.
 */
export interface PasswordLostVerifyRequest {
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
export interface PasswordLostVerifyResponse {
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
    IdentityRequest | PasswordLoginRequest | PasswordLostRequest | PasswordLostVerifyRequest |
    SignOutRequest;

/**
 * All valid interfaces for responses, used for the `issueAuthenticationRequest` implementation.
 */
type ResponseTypes =
    IdentityResponse | PasswordLoginResponse | PasswordLostResponse | PasswordLostVerifyResponse |
    SignOutResponse;

/**
 * Issues an authentication request to validate whether the username in `request` has a known
 * account. If so, the associated credential identity will be returned, allowing the user to sign in
 * using either their passkey or with their password.
 *
 * @param request The `{ username }` for whom the identity should be checked.
 * @returns Whether there is a user with this identity, and if so, their credential identities.
 */
export async function issueAuthenticationRequest(request: IdentityRequest)
        : Promise<IdentityResponse>;

/**
 * Issues an authentication request to sign in the username and password in `request`. When this
 * is successful, a response will be returned that carries the identity cookie.
 *
 * @param request The `{ username, password }` for whom a sign in should be attempted.
 * @returns Whether the sign in attempt was successful.
 */
export async function issueAuthenticationRequest(request: PasswordLoginRequest)
        : Promise<PasswordLoginResponse>;

/**
 * Issues an authentication request to reset the password of the user contained within the `request`
 *
 * @param request The `{ username }` for whom a password reset should be requested.
 * @returns Whether the password reset instructions were e-mailed.
 */
export async function issueAuthenticationRequest(request: PasswordLostRequest)
        : Promise<PasswordLostResponse>;


/**
 * Verifies the validity of a password reset token with the server, and obtains the requester's
 * first name in order to personalize the continuation of the password reset flow.
 *
 * @param request The sealed password reset request information that should be verified.
 * @returns Whether the request is valid, and the requester's first name.
 */
export async function issueAuthenticationRequest(request: PasswordLostVerifyRequest)
        : Promise<PasswordLostVerifyResponse>;

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

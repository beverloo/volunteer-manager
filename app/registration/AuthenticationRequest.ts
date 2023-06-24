// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Request format for an API call to the authentication endpoint requesting someone's identity.
 */
export interface IdentityRequest {
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
type RequestTypes = IdentityRequest | PasswordLoginRequest | SignOutRequest;

/**
 * All valid interfaces for responses, used for the `issueAuthenticationRequest` implementation.
 */
type ResponseTypes = IdentityResponse | PasswordLoginResponse | SignOutResponse;

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

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Request format for an API call to the authentication endpoint requesting an account to be created
 */
export interface RegistrationRequest {
    /**
     * The "action" must be set to password-reset-verify.
     */
    action: 'registration';

    /**
     * The username of the account that should be created.
     */
    username: string;

    /**
     * The password associated with that account, SHA256 hashed.
     */
    password: string;

    /**
     * The user's first name.
     */
    firstName: string;

    /**
     * The user's last name.
     */
    lastName: string;

    /**
     * Gender of the user. A string because we don't care.
     */
    gender: string;

    /**
     * Date on which the user was born. (YYYY-MM-DD)
     */
    birthdate: string;

    /**
     * Phone number of the user, in an undefined format.
     */
    phoneNumber: string;

    /**
     * Whether the user has accepted the terms of our privacy policy.
     */
    gdpr: boolean;
}

/**
 * Response format from an API call to the authentication endpoint requesting an account.
 */
export interface RegistrationResponse {
    /**
     * The result of the registration request, one of an enumeration of strings.
     */
    result: 'success';
}

/**
 * All valid interfaces for requests, used for the `issueAuthenticationRequest` implementation.
 */
type RequestTypes = RegistrationRequest;

/**
 * All valid interfaces for responses, used for the `issueAuthenticationRequest` implementation.
 */
type ResponseTypes = RegistrationResponse;

/**
 * Requests an account with the given `request` to be created on the server. The response indicates
 * whether account creation was successful; the user will still have to validate their account by
 * clicking on a link in an e-mail they will receive.
 *
 * @param request The registration request for the account that should be created.
 * @returns Whether account creation was successful.
 */
export async function issueAuthenticationRequest(request: RegistrationRequest)
        : Promise<RegistrationResponse>;

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

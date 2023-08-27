// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Settings required for authenticating with the AnimeCon API.
 */
export interface ClientAuthSettings {
    /**
     * Endpoint at which we can authenticate our client usage.
     */
    authEndpoint: string;

    /**
     * ID of our client with the AnimeCon API.
     */
    clientId: string;

    /**
     * Secret of our client with the AnimeCon API.
     */
    clientSecret: string;

    /**
     * Username through which we identify with the AnimeCon API.
     */
    username: string;

    /**
     * Password through which we identify with the AnimeCon API.
     */
    password: string;

    /**
     * Scopes for which we are will authenticate with the auth endpoint. Must be a comma-separated
     * list, e.g. "foo, bar, baz".
     */
    scopes: string;
}

/**
 * Authentication driver for the AnimeCon API. Will make an OAuth2 request to the indicated endpoint
 * to obtain a JWT token, which in turn can be used to authenticate further requests.
 */
export class ClientAuth {
    #authEndpoint: string;
    #clientId: string;
    #clientSecret: string;
    #username: string;
    #password: string;
    #scopes: string;

    constructor(settings: ClientAuthSettings) {
        this.#authEndpoint = settings.authEndpoint;
        this.#clientId = settings.clientId;
        this.#clientSecret = settings.clientSecret;
        this.#username = settings.username;
        this.#password = settings.password;
        this.#scopes = settings.scopes;
    }
}

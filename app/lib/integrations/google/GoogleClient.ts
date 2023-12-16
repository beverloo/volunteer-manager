// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Settings for the Google client, which focuses on the authentication information that's needed to
 * communciate with the different services Google offers through APIs.
 */
export interface GoogleClientSettings {
    /**
     * API key owned by the `projectId` through which Generative API functionality can be used.
     */
    apiKey: string;

    /**
     * Credentials through which computation resources owned by the `projectId` can be used.
     */
    credentials: string;

    /**
     * The computing center location in which resources should be consumed.
     */
    location: string;

    /**
     * Unique ID of the project that we will bill usage to.
     */
    projectId: string;
}

/**
 * The Google Client encapsulates the authentication information necessary to communicate with the
 * Google Cloud APIs. For now this class just stores data.
 */
export class GoogleClient implements GoogleClientSettings {
    #settings: GoogleClientSettings;

    constructor(settings: GoogleClientSettings) {
        this.#settings = settings;
    }

    get apiKey() { return this.#settings.apiKey; }
    get credentials() { return this.#settings.credentials; }
    get location() { return this.#settings.location; }
    get projectId() { return this.#settings.projectId; }
}

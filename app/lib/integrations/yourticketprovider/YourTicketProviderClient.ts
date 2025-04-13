// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type YourTicketProviderOrganisersResponse, kYourTicketProviderOrganisersResponse } from './YourTicketProviderTypes';

/**
 * Settings required by the YourTicketProvider integration.
 */
export interface YourTicketProviderClientSettings {
    /**
     * API key that will be the authentication token for the YourTicketProvider API integration.
     * This must be the API key by the event's owner; it's not sufficient to have access to the
     * event through another account.
     */
    apiKey: string;

    /**
     * Endpoint through which the YourTicketProvider API can be reached.
     */
    endpoint: string;
}

/**
 * The YourTicketProvider client integrates with the YTP Ticketing API to obtain information about
 * the products and tickets sold for particular events.
 * 
 * @see https://www.yourticketprovider.nl/account/accountintegrations/ticketing-api
 */
export class YourTicketProviderClient {
    #settings: YourTicketProviderClientSettings;

    constructor(settings: YourTicketProviderClientSettings) {
        this.#settings = settings;
    }

    /**
     * Calls the /Organisers API, which returns a list of the organisers that the given API Key has
     * access to. This is used to avoid requiring user information for the service's health check.
     */
    async getOrganisers(): Promise<YourTicketProviderOrganisersResponse['value']> {
        const url = `${this.#settings.endpoint}/Organisers?api_key=${this.#settings.apiKey}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: [
                [ 'Accept', 'application/json' ],
                [ 'Authorization', `${this.#settings.apiKey}`],
            ],
            next: {
                revalidate: /* seconds= */ 300,
            }
        });

        if (!response.ok)
            throw new Error(`Unable to call into the YTP API (${response.statusText})`);

        const unverifiedResponseJson = await response.json();
        const verifiedResponseJson =
            kYourTicketProviderOrganisersResponse.parse(unverifiedResponseJson);

        return verifiedResponseJson.value;
    }
}

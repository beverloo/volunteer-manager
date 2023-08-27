// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { Activity, ActivityType, Floor, Timeslot } from './ClientTypes';
import { kActivityDefinition, kActivityTypeDefinition, kFloorDefinition, kTimeslotDefinition }
    from './ClientTypes';

import { ClientAuth, type ClientAuthSettings } from './ClientAuth';

/**
 * Settings that must be provided to the AnimeCon Client. These are required towards making any
 * API call, regardless of event or parameters.
 */
export interface ClientSettings extends ClientAuthSettings {
    /**
     * Endpoint for the AnimeCon API that the Volunteer Portal communicates with.
     */
    apiEndpoint: string;
}

/**
 * Filters that can be provided in the `Client::issueRequest()` method.
 */
type Filters = Record<string, boolean | number | string>;

/**
 * Filters that may be provided in the `Client::getActivities()` method.
 */
type GetActivitiesFilters = {
    year?: string;  // exact match
    title?: string;  // partial match
    visible?: boolean;  // exact match
};

/**
 * Filters that may be provided in the `Client::getTimeslots()` method.
 */
type GetTimeslotsFilters = {
    'dateStartsAt[before]'?: string;  // YYYY-MM-DD, exact match
    'dateStartsAt[after]'?: string;  // YYYY-MM-DD, exact match
    'dateEndsAt[before]'?: string;  // YYYY-MM-DD, exact match
    'dateEndsAt[after]'?: string;  // YYYY-MM-DD, exact match
    'activity.visible'?: boolean;
    'activity.activityType.visible'?: boolean;
    'activity.id'?: number;
    'activity.year'?: number;
    'location.id'?: number;
    'activity.activityType.id'?: number;
};

/**
 * Client for the AnimeCon Integration, loosely based on the official REST API Client.
 *
 * @see https://github.com/AnimeNL/php-rest-api-client
 * @see https://github.com/AnimeNL/php-rest-api-client/blob/master/src/AnimeConClient.php
 */
export class Client {
    #apiEndpoint: string;
    #auth: ClientAuth;

    constructor(settings: ClientSettings) {
        const { apiEndpoint, ...authSettings } = settings;

        this.#apiEndpoint = apiEndpoint;
        this.#auth = new ClientAuth(authSettings);
    }

    /**
     * Returns the activities, optionally filtered based on the given `filters`. This will issue an
     * authenticated API call to the AnimeCon API endpoint.
     */
    async getActivities(filters?: GetActivitiesFilters): Promise<Activity[]> {
        const response = await this.issueRequest('activities.json', filters);
        return await z.array(kActivityDefinition).parseAsync(response);
    }

    /**
     * Returns the valid activity types, for which no filters are available. This will issue an
     * authenticated API call to the AnimeCon API endpoint.
     */
    async getActivityTypes(): Promise<ActivityType[]> {
        const response = await this.issueRequest('activity-types.json');
        return await z.array(kActivityTypeDefinition).parseAsync(response);
    }

    /**
     * Returns the floors, for which no filters are available. This will issue an authenticated API
     * call to the AnimeCon API endpoint.
     */
    async getFloors(): Promise<Floor[]> {
        const response = await this.issueRequest('floors.json');
        return await z.array(kFloorDefinition).parseAsync(response);
    }

    /**
     * Returns the timeslots, optionally filtered by the given `filters`. This is a very wasteful
     * API call as a lot of redundant activity information will be repeated throughout the response.
     * This will issue an authenticated API call to the AnimeCon API endpoint.
     */
    async getTimeslots(filters?: GetTimeslotsFilters): Promise<Timeslot[]> {
        const response = await this.issueRequest('timeslots.json', filters);
        return await z.array(kTimeslotDefinition).parseAsync(response);
    }

    /**
     * Actually issues an API request to the AnimeCon API endpoint. This method will ensure that a
     * valid JWT token is available, and then issue the request to obtain the response.
     */
    private async issueRequest(relativePath: string, filters?: Filters): Promise<any[]> {
        // TODO: Authenticate (w/ cache)
        // TODO: Compose the API request (`filters` in a query)
        return [];
    }
}

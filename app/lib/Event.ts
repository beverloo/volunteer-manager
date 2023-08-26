// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Interface that maps to the database representation of an event.
 */
export interface EventDatabaseRow {
    eventId: number;
    eventName: string;
    eventShortName: string;
    eventSlug: string;
    eventStartTime: Date;
    eventEndTime: Date;
    environments: {
        environment?: string,
        enableContent?: number;
        enableRegistration?: number;
        enableSchedule?: number;
    }[];
}

/**
 * Represents the data associated with one of the AnimeCon festivals made available to both server-
 * and client-side components.
 */
export interface EventData {
    /**
     * Full name of this event, including the theme.
     */
    name: string;

    /**
     * Short name of this event.
     */
    shortName: string;

    /**
     * URL-safe slug that can be used to represent this event.
     */
    slug: string;

    /**
     * Start time of the event, as a `YYYY-MM-DD HH:II:SS` DATETIME representation.
     */
    startTime: string;

    /**
     * End time of the event, as a `YYYY-MM-DD HH:II:SS` DATETIME representation.
     */
    endTime: string;
}

/**
 * Represents the data associated with an event for a particular environment. Events can have
 * multiple environments associated with them.
 */
export interface EventEnvironmentData {
    /**
     * Whether access to the event's content portal is unrestricted.
     */
    enableContent: boolean;

    /**
     * Whether visitors have the ability to apply to participate in this event.
     */
    enableRegistration: boolean;

    /**
     * Whether visitors have access to the event's volunteer portal.
     */
    enableSchedule: boolean;

    /**
     * Name of the environment that is currently being considered.
     */
    environmentName: string;
}

/**
 * Data associated with an event specific to a particular environment.
 */
export type EventDataWithEnvironment = EventData & EventEnvironmentData;

/**
 * Represents one of the AnimeCon festivals.
 */
export class Event implements EventData {
    #environments: Map<string, EventEnvironmentData>;
    #event: EventDatabaseRow;

    constructor(event: EventDatabaseRow) {
        this.#environments = new Map;
        this.#event = event;

        for (const environmentInfo of event.environments) {
            if (!environmentInfo.environment)
                continue;  // partial information, this should never happen

            this.#environments.set(environmentInfo.environment, {
                enableContent: !!environmentInfo.enableContent,
                enableRegistration: !!environmentInfo.enableRegistration,
                enableSchedule: !!environmentInfo.enableSchedule,
                environmentName: environmentInfo.environment,
            });
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Functionality limited to server components:
    // ---------------------------------------------------------------------------------------------

    /**
     * Numeric unique ID of the event, as it's represented in the database.
     */
    get eventId() { return this.#event.eventId; }

    /**
     * Returns the environment information for the given |environmentName| when it exists, or
     * `undefined` in all other cases.
     */
    getEnvironmentData(environmentName: string): EventEnvironmentData | undefined {
        return this.#environments.get(environmentName);
    }

    /**
     * Whether this event has environment information for the given |environmentName|.
     */
    hasEnvironmentData(environmentName: string): boolean {
        return this.#environments.has(environmentName);
    }

    // ---------------------------------------------------------------------------------------------
    // Functionality also available to client components, i.e. EventData implementation:
    // ---------------------------------------------------------------------------------------------

    get name() { return this.#event.eventName; }
    get shortName() { return this.#event.eventShortName; }
    get slug() { return this.#event.eventSlug; }
    get startTime() { return this.#event.eventStartTime.toISOString(); }
    get endTime() { return this.#event.eventEndTime.toISOString(); }


    // ---------------------------------------------------------------------------------------------
    // Functionality to obtain a plain EventData object:
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns a plain JavaScript object that conforms to the EventData interface.
     */
    toEventData(): EventData;
    toEventData(environmentName: string): EventDataWithEnvironment;
    toEventData(environmentName?: string) {
        const eventData = {
            name: this.name,
            shortName: this.shortName,
            slug: this.slug,
            startTime: this.startTime,
            endTime: this.endTime,
        };

        if (!environmentName)
            return eventData;

        const environmentData = this.getEnvironmentData(environmentName);
        if (!environmentData)
            throw new Error(`This event does not have this environment: ${environmentName}`);

        return {
            ...eventData,

            enableContent: environmentData.enableContent,
            enableRegistration: environmentData.enableRegistration,
            enableSchedule: environmentData.enableSchedule,
            environmentName: environmentData.environmentName,
        };
    }
}

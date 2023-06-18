// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Interface that maps to the database representation of an event.
 */
export interface EventDatabaseRow {
    event_id: number;
    event_name: string;
    event_short_name: string;
    event_slug: string;
    event_start_time: string;
    event_end_time: string;
    enable_content: boolean;
    enable_registration: boolean;
    enable_schedule: boolean;
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
}

/**
 * Represents one of the AnimeCon festivals.
 */
export class Event implements EventData {
    #event: EventDatabaseRow;

    constructor(event: EventDatabaseRow) {
        this.#event = event;
    }

    // ---------------------------------------------------------------------------------------------
    // Functionality limited to server components:
    // ---------------------------------------------------------------------------------------------

    /**
     * Numeric unique ID of the event, as it's represented in the database.
     */
    get eventId() { return this.#event.event_id; }

    // ---------------------------------------------------------------------------------------------
    // Functionality also available to client components, i.e. EventData implementation:
    // ---------------------------------------------------------------------------------------------

    get name() { return this.#event.event_name; }
    get shortName() { return this.#event.event_short_name; }
    get slug() { return this.#event.event_slug; }
    get startTime() { return this.#event.event_start_time; }
    get endTime() { return this.#event.event_end_time; }
    get enableContent() { return this.#event.enable_content; }
    get enableRegistration() { return this.#event.enable_registration; }
    get enableSchedule() { return this.#event.enable_schedule; }


    // ---------------------------------------------------------------------------------------------
    // Functionality to obtain a plain EventData object:
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns a plain JavaScript object that conforms to the EventData interface.
     */
    toEventData(): EventData {
        return {
            name: this.name,
            shortName: this.shortName,
            slug: this.slug,
            startTime: this.startTime,
            endTime: this.endTime,
            enableContent: this.enableContent,
            enableRegistration: this.enableRegistration,
            enableSchedule: this.enableSchedule,
        };
    }
}

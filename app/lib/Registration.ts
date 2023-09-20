// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { RegistrationStatus } from './database/Types';

/**
 * Interface that maps to the database representation of a registration.
 */
export interface RegistrationDatabaseRow {
    role: string;
    status: RegistrationStatus;

    availabilityAvailable: boolean;
    availabilityEligible: boolean;
    // TODO: `availability`

    hotelAvailable: boolean;
    hotelEligible: boolean;
    hotelPreferences?: {
        hotelId?: number;
        hotelName?: string;
        hotelRoom?: string;
        checkIn?: Date;
        checkOut?: Date;
        sharingPeople?: number;
        sharingPreferences?: string;
        updated?: Date;
    };

    trainingAvailable: boolean;
    trainingEligible: boolean;
    // TODO: `training`
}

/**
 * Hotel information associated with a registration for participation in a particular event.
 */
export interface RegistrationHotelRequest {
    /**
     * ID of the hotel room they would like to stay in, if any.
     */
    hotelId?: number;

    /**
     * Name of the hotel they would like to stay in, if any.
     */
    hotelName?: string;

    /**
     * Name of the hotel room they would like to stay in, if any.
     */
    hotelRoom?: string;

    /**
     * Check-in date of the hotel, starting on which they can stay over.
     */
    checkIn?: Date;

    /**
     * Check-out date of the hotel, on which day they will have to leave.
     */
    checkOut?: Date;

    /**
     * Number of people they would like to share their hotel room with.
     */
    sharingPeople?: number;

    /**
     * Preferences regarding sharing their hotel room. With who?
     */
    sharingPreferences?: string;

    /**
     * Date on which the volunteer's hotel information was updated.
     */
    updated?: Date;
}

/**
 * Information related to a hotel room booking contained within a registration.
 */
export interface RegistrationHotelBooking {
    /**
     * Date on which the hotel room can be checked in to.
     */
    checkIn: Date;

    /**
     * Date on which the hotel room can be checked out of.
     */
    checkOut: Date;

    /**
     * The hotel and room that the volunteer was booked in to.
     */
    hotel: {
        name: string;
        room: string;
    };

    /**
     * The people they will be sharing the room with, if any.
     */
    sharing: string[];
}

/**
 * General information about a volunteer's application to participate in one of the events.
 *
 * Various pieces of registration data exist of three separate toggles: is the data available, is
 * the volunteer eligible to express their preferences, and has the volunteer expressed their
 * preferences. It's possible for senior+ volunteers to express preferences on behalf of others.
 */
export interface RegistrationData {
    /**
     * Name of the role for which the volunteer has applied. Should only be used when they have been
     * accepted, as other statuses may not reflect this correctly.
     */
    role: string;

    /**
     * Status of the registration. Can be changed by senior volunteers.
     */
    status: RegistrationStatus;

    // ---------------------------------------------------------------------------------------------
    // Availability
    // ---------------------------------------------------------------------------------------------

    /**
     * Whether the necessary data to indicate availability during the event exists.
     */
    availabilityAvailable: boolean;

    /**
     * Whether the volunteer is eligible to indicate their availablity, not accounting overrides.
     */
    availabilityEligible: boolean;

    /**
     * The preferences the volunteer has provided regarding their availability.
     */
    availability: undefined;

    // ---------------------------------------------------------------------------------------------
    // Hotel reservations
    // ---------------------------------------------------------------------------------------------

    /**
     * Whether the necessary data to indicate hotel bookings during the event exists.
     */
    hotelAvailable: boolean;

    /**
     * Whether the volunteer is eligible to indicate hotel preferences, not accounting overrides.
     */
    hotelEligible: boolean;

    /**
     * The preferences the volunteer has provided regarding their hotel bookings.
     */
    hotelPreferences?: RegistrationHotelRequest;

    /**
     * The hotel bookings that were made on behalf of this volunteer.
     */
    hotelBookings: RegistrationHotelBooking[];

    // ---------------------------------------------------------------------------------------------
    // Trainings
    // ---------------------------------------------------------------------------------------------

    /**
     * Whether the necessary data to indicate training preferences during the event exists.
     */
    trainingAvailable: boolean;

    /**
     * Whether the volunteer is eligible to indicate training preferences, not accounting overrides.
     */
    trainingEligible: boolean;

    /**
     * The preferences the volunteer has provided regarding their participation in trainings.
     */
    training: undefined;
}

/**
 * Encapsulates the registration information for a particular volunteer at a particular event. This
 * instance can only be used on the server, use `toRegistrationData` to get the client-side
 * representation of the same information.
 *
 * TODO: Availability information
 */
export class Registration implements RegistrationData {
    #registration: RegistrationDatabaseRow;

    #hotelBookings: RegistrationHotelBooking[];

    constructor(registration: RegistrationDatabaseRow, hotelBookings: RegistrationHotelBooking[]) {
        this.#registration = registration;
        this.#hotelBookings = hotelBookings;
    }

    // ---------------------------------------------------------------------------------------------
    // Functionality also available to client components, i.e. RegistrationData implementation:
    // ---------------------------------------------------------------------------------------------

    get role() { return this.#registration.role; }
    get status() { return this.#registration.status; }

    get availabilityAvailable() { return this.#registration.availabilityAvailable; }
    get availabilityEligible() { return this.#registration.availabilityEligible; }
    get availability() { return undefined; }

    get hotelAvailable() { return this.#registration.hotelAvailable; }
    get hotelEligible() { return this.#registration.hotelEligible; }
    get hotelPreferences() { return this.#registration.hotelPreferences; }
    get hotelBookings() { return this.#hotelBookings; }

    get trainingAvailable() { return this.#registration.trainingAvailable; }
    get trainingEligible() { return this.#registration.trainingEligible; }
    get training() { return undefined; }

    // ---------------------------------------------------------------------------------------------
    // Functionality to obtain a plain RegistrationData object:
    // ---------------------------------------------------------------------------------------------

    /**
     * Converts this instance to a RegistrationData object that can be transferred to the client.
     */
    toRegistrationData(): RegistrationData {
        return {
            role: this.role,
            status: this.status,

            availabilityAvailable: this.availabilityAvailable,
            availabilityEligible: this.availabilityEligible,
            availability: this.availability,

            hotelAvailable: this.hotelAvailable,
            hotelEligible: this.hotelEligible,
            hotelPreferences: this.hotelPreferences,
            hotelBookings: this.#hotelBookings,

            trainingAvailable: this.trainingAvailable,
            trainingEligible: this.trainingEligible,
            training: this.training,
        };
    }
}

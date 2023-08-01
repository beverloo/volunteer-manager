// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Valid statuses for a received registration.
 */
type RegistrationStatus = 'Registered' | 'Cancelled' | 'Accepted' | 'Rejected';

/**
 * Interface that maps to the database representation of a registration.
 */
export interface RegistrationDatabaseRow {
    hotel_eligible: boolean;
    registration_date: string;
    registration_status: RegistrationStatus;
    role_name: string;
}

/**
 * General information about a volunteer's application to participate in one of the events.
 */
export interface RegistrationData {
    /**
     * Whether the volunteer is eligible to book a hotel room through AnimeCon.
     */
    hotelEligible: boolean;

    /**
     * Name of the role for which the volunteer has applied. Should only be used when they have been
     * accepted, as other statuses may not reflect this correctly.
     */
    role?: string;

    /**
     * Status of the registration. Can be changed by senior volunteers.
     */
    status: RegistrationStatus;
}

/**
 * Encapsulates the registration information for a particular volunteer at a particular event. This
 * instance can only be used on the server, use `toRegistrationData` to get the client-side
 * representation of the same information.
 *
 * TODO: Availability information
 * TODO: Hotel information
 */
export class Registration implements RegistrationData {
    #registration: RegistrationDatabaseRow;

    constructor(registration: RegistrationDatabaseRow) {
        this.#registration = registration;
    }

    // ---------------------------------------------------------------------------------------------
    // Functionality limited to server components:
    // ---------------------------------------------------------------------------------------------

    // None yet.

    // ---------------------------------------------------------------------------------------------
    // Functionality also available to client components, i.e. RegistrationData implementation:
    // ---------------------------------------------------------------------------------------------

    get hotelEligible() { return !!this.#registration.hotel_eligible; }
    get role() { return this.#registration.role_name; }
    get status() { return this.#registration.registration_status; }

    // ---------------------------------------------------------------------------------------------
    // Functionality to obtain a plain RegistrationData object:
    // ---------------------------------------------------------------------------------------------

    /**
     * Converts this instance to a RegistrationData object that can be transferred to the client.
     */
    toRegistrationData(): RegistrationData {
        return {
            hotelEligible: this.hotelEligible,
            role: this.role,
            status: this.status,
        };
    }
}

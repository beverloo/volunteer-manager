// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { EventAvailabilityStatus, RegistrationStatus } from './database/Types';
import type { Temporal } from '@lib/Temporal';

import { getAvailabilityWindowStatus, type AvailabilityWindowStatus }
    from './isAvailabilityWindowOpen';

/**
 * Interface that maps to the database representation of a registration.
 */
interface RegistrationDatabaseRow {
    role: string;
    teamId: number;
    status: RegistrationStatus;

    availabilityStatus: EventAvailabilityStatus,
    availabilityEventLimit: number;
    availability?: {
        preferences?: string;
        preferencesDietary?: string;
        serviceHours?: number;
        serviceTimingStart?: number;
        serviceTimingEnd?: number;
        timeslots?: string;
    },

    hotelInformationPublished: boolean;
    hotelAvailabilityWindow?: { start?: Temporal.ZonedDateTime; end?: Temporal.ZonedDateTime };
    hotelEligible: boolean;
    hotelPreferences?: {
        hotelId?: number;
        hotelName?: string;
        hotelRoom?: string;
        checkIn?: string;
        checkOut?: string;
        sharingPeople?: number;
        sharingPreferences?: string;
        updated?: string;
    };

    refundInformationPublished: boolean;
    refundAvailabilityWindow?: { start?: Temporal.ZonedDateTime; end?: Temporal.ZonedDateTime };
    refund?: {
        ticketNumber?: string;
        accountIban?: string;
        accountName?: string;
        requested?: string;
        confirmed?: string;
    },

    trainingInformationPublished: boolean;
    trainingAvailabilityWindow?: { start?: Temporal.ZonedDateTime; end?: Temporal.ZonedDateTime };
    trainingEligible: boolean;
    training?: {
        confirmed?: boolean;
        preference?: number;
        updated?: string;

        preferenceDate?: string;
        assignedDate?: string;
        assignedEndDate?: string;
        assignedAddress?: string;
    };
}

/**
 * Availability information stored as part of the volunteer's preferences.
 */
export interface RegistrationAvailability {
    /**
     * Specific preferences indicated by the volunteer, if any.
     */
    preferences?: string;

    /**
     * Specific dietary preferences indicated by the volunteer, if any.
     */
    preferencesDietary?: string;

    /**
     * The list of timeslots that the volunteer would really like to attend.
     */
    timeslots: number[];

    /**
     * The maximum number of hours the volunteer would like to help out with.
     */
    serviceHours?: number;

    /**
     * The window during which the volunteer would prefer to help out.
     */
    serviceTiming?: string;
}

/**
 * Hotel information associated with a registration for participation in a particular event.
 */
interface RegistrationHotelRequest {
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
     * Check-in date of the hotel, starting on which they can stay over. ("YYYY-MM-DD")
     */
    checkIn?: string;

    /**
     * Check-out date of the hotel, on which day they will have to leave. ("YYYY-MM-DD")
     */
    checkOut?: string;

    /**
     * Number of people they would like to share their hotel room with.
     */
    sharingPeople?: number;

    /**
     * Preferences regarding sharing their hotel room. With who?
     */
    sharingPreferences?: string;

    /**
     * Date on which the volunteer's hotel information was updated, in a `Temporal.ZonedDateTime`-
     * compatible format in UTC.
     */
    updated?: string;
}

/**
 * Information related to a hotel room booking contained within a registration.
 */
interface RegistrationHotelBooking {
    /**
     * Date on which the hotel room can be checked in to. ("YYYY-MM-DD")
     */
    checkIn: string;

    /**
     * Date on which the hotel room can be checked out of. ("YYYY-MM-DD")
     */
    checkOut: string;

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
 * Information about the volunteer's ticket refund request, if any.
 */
export interface RegistrationRefund {
    /**
     * The volunteer's ticket number, when known.
     */
    ticketNumber?: string;

    /**
     * The volunteer's bank account IBAN number.
     */
    accountIban?: string;

    /**
     * The volunteer's bank account holder name.
     */
    accountName?: string;

    /**
     * Date on which the refund has been requested, in a `Temporal.ZonedDateTime`-compatible format
     * in UTC.
     */
    requested?: string;

    /**
     * Date on which the refund has been confirmed, if any.
     */
    confirmed?: string;
}

/**
 * Information about the volunteer's preferences regarding participation in the training, as well as
 * their assigned training date, if any.
 */
export interface RegistrationTraining {
    /**
     * Whether the volunteer's training preferences have been confirmed by a manager.
     */
    confirmed?: boolean;

    /**
     * Set to a non-null value when the volunteer has indicated a preference.
     */
    preference?: number;

    /**
     * Date on which the volunteer would like to participate in the training, if any.
     */
    preferenceDate?: string;

    /**
     * Date on which the volunteer has been assigned to participate in the training, if any.
     */
    assignedDate?: string;

    /**
     * Date and time on which the assigned training is supposed to end.
     */
    assignedEndDate?: string;

    /**
     * Address where the assigned training will be taking place, if any.
     */
    assignedAddress?: string;

    /**
     * When the preferences were last updated by the volunteer, in a `Temporal.ZonedDateTime`-
     * compatible format in UTC.
     */
    updated?: string;
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
     * Unique ID of the team that the volunteer will be participating in.
     */
    teamId: number;

    /**
     * Status of the registration. Can be changed by senior volunteers.
     */
    status: RegistrationStatus;

    // ---------------------------------------------------------------------------------------------
    // Availability
    // ---------------------------------------------------------------------------------------------

    /**
     * Whether the volunteer has access to the availability system by default.
     */
    availabilityStatus: EventAvailabilityStatus;

    /**
     * Maximum number of events that the volunteer can flag as wanting to attend.
     */
    availabilityEventLimit: number;

    /**
     * The preferences the volunteer has provided regarding their availability.
     */
    availability: RegistrationAvailability;

    // ---------------------------------------------------------------------------------------------
    // Hotel reservations
    // ---------------------------------------------------------------------------------------------

    /**
     * Whether the necessary data to indicate hotel bookings during the event has been published.
     */
    hotelInformationPublished: boolean;

    /**
     * Whether the hotel preferences availability window is currently open.
     */
    hotelAvailabilityWindow: AvailabilityWindowStatus;

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
    // Refunds
    // ---------------------------------------------------------------------------------------------

    /**
     * Whether the availability of requesting a refund has been published.
     */
    refundInformationPublished: boolean;

    /**
     * Whether the refund requests availability window is currently open.
     */
    refundAvailabilityWindow: AvailabilityWindowStatus;

    /**
     * The refund preferences that the volunteer has indicated, together with confirmation status.
     */
    refund?: RegistrationRefund;

    // ---------------------------------------------------------------------------------------------
    // Trainings
    // ---------------------------------------------------------------------------------------------

    /**
     * Whether the necessary data to indicate training preferences has been published.
     */
    trainingInformationPublished: boolean;

    /**
     * Whether the training preferences availability window is currently open.
     */
    trainingAvailabilityWindow: AvailabilityWindowStatus;

    /**
     * Whether the volunteer is eligible to indicate training preferences, not accounting overrides.
     */
    trainingEligible: boolean;

    /**
     * The preferences the volunteer has provided regarding their participation in trainings.
     */
    training?: RegistrationTraining;
}

/**
 * Encapsulates the registration information for a particular volunteer at a particular event. This
 * instance can only be used on the server, use `toRegistrationData` to get the client-side
 * representation of the same information.
 */
export class Registration implements RegistrationData {
    #registration: RegistrationDatabaseRow;

    #hotelAvailabilityWindow: AvailabilityWindowStatus;
    #refundAvailabilityWindow: AvailabilityWindowStatus;
    #trainingAvailabilityWindow: AvailabilityWindowStatus;

    #availability: RegistrationAvailability;
    #hotelBookings: RegistrationHotelBooking[];

    constructor(registration: RegistrationDatabaseRow, hotelBookings: RegistrationHotelBooking[]) {
        this.#registration = registration;

        this.#hotelAvailabilityWindow =
            getAvailabilityWindowStatus(registration.hotelAvailabilityWindow);
        this.#refundAvailabilityWindow =
            getAvailabilityWindowStatus(registration.refundAvailabilityWindow);
        this.#trainingAvailabilityWindow =
            getAvailabilityWindowStatus(registration.trainingAvailabilityWindow);

        const { availability } = registration;
        {
            let timeslots: number[] = [ /* no timeslots */ ];
            if (!!availability?.timeslots)
                timeslots = availability.timeslots.split(',').map(v => parseInt(v));

            let serviceTiming: string | undefined;
            if (typeof availability?.serviceTimingStart === 'number' &&
                    typeof availability?.serviceTimingEnd === 'number') {
                serviceTiming = [
                    availability.serviceTimingStart,
                    availability.serviceTimingEnd
                ].join('-');
            }

            this.#availability = {
                preferences: registration.availability?.preferences,
                preferencesDietary: registration.availability?.preferencesDietary,
                serviceHours: registration.availability?.serviceHours,
                serviceTiming,
                timeslots
            };
        }

        this.#hotelBookings = hotelBookings;
    }

    // ---------------------------------------------------------------------------------------------
    // Functionality also available to client components, i.e. RegistrationData implementation:
    // ---------------------------------------------------------------------------------------------

    get role() { return this.#registration.role; }
    get teamId() { return this.#registration.teamId; }
    get status() { return this.#registration.status; }

    get availabilityStatus() { return this.#registration.availabilityStatus; }
    get availabilityEventLimit() { return this.#registration.availabilityEventLimit; }
    get availability() { return this.#availability; }

    get hotelInformationPublished() { return this.#registration.hotelInformationPublished; }
    get hotelAvailabilityWindow() { return this.#hotelAvailabilityWindow; }
    get hotelEligible() { return this.#registration.hotelEligible; }
    get hotelPreferences() { return this.#registration.hotelPreferences; }
    get hotelBookings() { return this.#hotelBookings; }

    get refundInformationPublished() { return this.#registration.refundInformationPublished; }
    get refundAvailabilityWindow() { return this.#refundAvailabilityWindow; }
    get refund() { return this.#registration.refund; }

    get trainingInformationPublished() { return this.#registration.trainingInformationPublished; }
    get trainingAvailabilityWindow() { return this.#trainingAvailabilityWindow; }
    get trainingEligible() { return this.#registration.trainingEligible; }
    get training() { return this.#registration.training; }
}

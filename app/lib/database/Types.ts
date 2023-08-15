// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Type of authentication credential that is stored in the value column.
 * @see Table `users_auth`
 */
export enum AuthType {
    code = 'code',
    passkey = 'passkey',
    password = 'password',
}

/**
 * Type of content that's stored within the storage buffer.
 * @see Table `storage`
 */
export enum FileType {
    Avatar = 'Avatar',
}

/**
 * Severities that can be assigned to log entries.
 * @see Table `logs`
 */
export enum LogSeverity {
    Debug = 'Debug',
    Info = 'Info',
    Warning = 'Warning',
    Error = 'Error',
}

/**
 * Status of a volunteer's registration to an event.
 * @see Table `users_events`
 */
export enum RegistrationStatus {
    Registered = 'Registered',
    Cancelled = 'Cancelled',
    Accepted = 'Accepted',
    Rejected = 'Rejected',
}

/**
 * Types of shift that can be stored in the database.
 * @see Table `schedule`
 */
export enum ScheduleType {
    Shift = 'Shift',
    Unavailable = 'Unavailable',
}

/**
 * Fit of a t-shirt that a volunteer has requested in a registration.
 */
export enum ShirtFit {
    Regular = 'Regular',
    Girly = 'Girly',
}

/**
 * Size of a t-shirt that a volunteer has requested in a registration.
 */
export enum ShirtSize {
    XS = 'XS',
    S = 'S',
    M = 'M',
    L = 'L',
    XL = 'XL',
    XXL = 'XXL',
    '3XL' = '3XL',
    '4XL' = '4XL',
}

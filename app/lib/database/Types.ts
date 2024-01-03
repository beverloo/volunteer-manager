// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Type of entry in the database program tables.
 * @see Table `activities`
 * @see Table `activities_timeslots`
 */
export enum ActivityType {
    Program = 'Program',
    Internal = 'Internal',
}

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
 * Status indicating whether volunteers can share their availability preferences.
 * @see Table `events`
 */
export enum EventAvailabilityStatus {
    Unavailable = 'Unavailable',
    Available = 'Available',
    Locked = 'Locked',
}

/**
 * Type of export that a particular entry describes.
 * @see Table `exports`
 */
export enum ExportType {
    Credits = 'Credits',
    Refunds = 'Refunds',
    Trainings = 'Trainings',
    Volunteers = 'Volunteers',
}

/**
 * Type of content that's stored within the storage buffer.
 * @see Table `storage`
 */
export enum FileType {
    Avatar = 'Avatar',
    EventIdentity = 'EventIdentity',
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
 * The type of (activity) mutation that happened in the AnPlan program.
 * @see Table `activities_logs`
 */
export enum Mutation {
    Created = 'Created',
    Updated = 'Updated',
    Deleted = 'Deleted',
}

/**
 * The severity of the (activity) mutation that happened in the AnPlan program.
 * @see Table `activities_logs`
 */
export enum MutationSeverity {
    Low = 'Low',
    Moderate = 'Moderate',
    Important = 'Important',
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
 * Status of reaching out regarding a volunteer's retention.
 * @see Table `retention`
 */
export enum RetentionStatus {
    Contacting = 'Contacting',
    Declined = 'Declined',
}

/**
 * The badges that can be assigned to individual roles.
 * @see Table `roles`
 */
export enum RoleBadge {
    Staff = 'Staff',
    Senior = 'Senior',
    Host = 'Host',
}

/**
 * Types of shift that can be stored in the database.
 * @see Table `schedule`
 */
export enum ScheduleType {
    Shift = 'shift',
    Unavailable = 'unavailable',
}

/**
 * Fit of a t-shirt that a volunteer has requested in a registration.
 * @see Table `users_events`
 * @see Table `vendors`
 */
export enum ShirtFit {
    Regular = 'Regular',
    Girly = 'Girly',
}

/**
 * Size of a t-shirt that a volunteer has requested in a registration.
 * @see Table `users_events`
 * @see Table `vendors`
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

/**
 * Possible results that can occur when running tasks.
 */
export enum TaskResult {
    TaskSuccess = 'TaskSuccess',
    TaskException = 'TaskException',
    TaskFailure = 'TaskFailure',
    InvalidNamedTask = 'InvalidNamedTask',
    InvalidParameters = 'InvalidParameters',
    InvalidTaskId = 'InvalidTaskId',
    UnknownFailure = 'UnknownFailure',
}

/**
 * Gender of a vendor, simplified display.
 * @see Table `vendors`
 */
export enum VendorGender {
    Female = 'Female',
    Other = 'Other',
    Male = 'Male',
}

/**
 * The team that a vendor can be part of.
 * @see Table `vendors`
 */
export enum VendorTeam {
    FirstAid = 'first-aid',
    Security = 'security',
}

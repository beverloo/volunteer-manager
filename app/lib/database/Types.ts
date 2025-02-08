// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Lists the values of a given type.
 */
type Values<T> = T[keyof T];

/**
 * Type of entry in the database program tables.
 * @see Table `activities`
 * @see Table `activities_timeslots`
 */
export type ActivityType = Values<typeof kActivityType>;
export const kActivityType = {
    Program: 'Program',
    Internal: 'Internal',
} as const;

/**
 * Type of authentication credential that is stored in the value column.
 * @see Table `users_auth`
 */
export type AuthType = Values<typeof kAuthType>;
export const kAuthType = {
    code: 'code',
    passkey: 'passkey',
    password: 'password',
} as const;

/**
 * Type of content that's stored within a particular scope.
 * @see Table `content`
 */
export type ContentType = Values<typeof kContentType>;
export const kContentType = {
    FAQ: 'FAQ',
    Page: 'Page',
} as const;

/**
 * Status of a help request issued by one of the displays.
 * @see Table `displays`
 */
export type DisplayHelpRequestStatus = Values<typeof kDisplayHelpRequestStatus>;
export const kDisplayHelpRequestStatus = {
    Pending: 'Pending',
    Acknowledged: 'Acknowledged',
} as const;

/**
 * Target of a help request issued by one of the displays.
 * @see Table `displays_requests`
 */
export type DisplayHelpRequestTarget = Values<typeof kDisplayHelpRequestTarget>;
export const kDisplayHelpRequestTarget = {
    Crew: 'Crew',
    Nardo: 'Nardo',
    Stewards: 'Stewards',
} as const;

/**
 * Purpose of an environment that defines what happens when someone visits them.
 * @see Table `environments`
 */
export type EnvironmentPurpose = Values<typeof kEnvironmentPurpose>;
export const kEnvironmentPurpose = {
    LandingPage: 'LandingPage',
} as const;

/**
 * Status indicating whether volunteers can share their availability preferences.
 * @see Table `events`
 */
export type EventAvailabilityStatus = Values<typeof kEventAvailabilityStatus>;
export const kEventAvailabilityStatus = {
    Unavailable: 'Unavailable',
    Available: 'Available',
    Locked: 'Locked',
} as const;

/**
 * Type of export that a particular entry describes.
 * @see Table `exports`
 */
export type ExportType = Values<typeof kExportType>;
export const kExportType = {
    Credits: 'Credits',
    Refunds: 'Refunds',
    Trainings: 'Trainings',
    Volunteers: 'Volunteers',
} as const;

/**
 * Type of content that's stored within the storage buffer.
 * @see Table `storage`
 */
export type FileType = Values<typeof kFileType>;
export const kFileType = {
    Avatar: 'Avatar',
    EventIdentity: 'EventIdentity',
} as const;

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
 * Type of message that is being logged by the Twilio table.
 * @see Table `outbox_twilio`
 */
export enum TwilioOutboxType {
    SMS = 'SMS',
    WhatsApp = 'WhatsApp',
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
 * Degree of expected overlap for the scheduled demand of a shift.
 * @see Table `shifts`
 */
export enum ShiftDemandOverlap {
    None = 'None',
    Partial = 'Partial',
    Cover = 'Cover',
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
 * Types of subscriptions that can be created for eligible users.
 * @see Table `subscriptions`
 */
export enum SubscriptionType {
    Application = 'Application',
    Help = 'Help',
    Registration = 'Registration',
    Test = 'Test',
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
 * Webhook endpoint that was posted to from the Twilio infrastructure.
 * @see Table `twilio_webhook_calls`
 */
export enum TwilioWebhookEndpoint {
    Inbound = 'Inbound',
    Outbound = 'Outbound',
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

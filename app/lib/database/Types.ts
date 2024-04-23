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
 * Type of content that's stored within a particular scope.
 * @see Table `content`
 */
export enum ContentType {
    FAQ = 'FAQ',
    Page = 'Page',
}

/**
 * Status of a help request issued by one of the displays.
 * @see Table `displays`
 */
export enum DisplayHelpRequestStatus {
    Pending = 'Pending',
    Acknowledged = 'Acknowledged',
}

/**
 * Target of a help request issued by one of the displays.
 * @see Table `displays_requests`
 */
export enum DisplayHelpRequestTarget {
    Crew = 'Crew',
    Nardo = 'Nardo',
    Stewards = 'Stewards',
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

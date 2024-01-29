// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { User } from '@lib/auth/User';
import { PlaywrightHooks } from './PlaywrightHooks';
import db, { tLogs } from '@lib/database';

import { LogSeverity } from './database/Types';
export { LogSeverity };

/**
 * Enumeration containing all the valid log types. Will be stored as a string, so keep alphabetized.
 */
export enum LogType {
    AccountActivate = 'account-activate',
    AccountIdentifyAccessCode = 'account-identify-access-code',
    AccountIdentifyPasskey = 'account-identify-passkey',
    AccountIdentifyPassword = 'account-identify-password',
    AccountPasskeyCreate = 'account-passkey-create',
    AccountPasskeyDelete = 'account-passkey-delete',
    AccountPasswordResetRequest = 'account-password-reset-request',
    AccountPasswordReset = 'account-password-reset',
    AccountPasswordUpdate = 'account-password-update',
    AccountRegister = 'account-register',
    AccountUpdateAvatar = 'account-update-avatar',
    AccountUpdate = 'account-update',
    AdminAccessVolunteerInfo = 'admin-access-volunteer-info',
    AdminClearHotelPreferences = 'admin-clear-hotel-preferences',
    AdminClearRefundRequest = 'admin-clear-refund-request',
    AdminClearTrainingPreferences = 'admin-clear-training-preferences',
    AdminContentMutation = 'admin-content-mutation',
    AdminEventApplication = 'admin-event-application',
    AdminEventCreate = 'admin-event-create',
    AdminEventHotelMutation = 'admin-event-hotel',
    AdminEventPublishInfo = 'admin-event-publish-info',
    AdminEventRetentionUpdate = 'admin-event-retention-update',
    AdminEventRoleUpdate = 'admin-event-role-update',
    AdminEventTeamUpdate = 'admin-event-team-update',
    AdminEventTrainingAssignment = 'admin-event-training-assignment',
    AdminEventTrainingMutation = 'admin-event-training',
    AdminEventTrainingExtraMutation = 'admin-event-training-extra',
    AdminExportMutation = 'admin-export-mutation',
    AdminHotelAssignVolunteer = 'admin-hotel-assign-volunteer',
    AdminHotelAssignVolunteerDelete = 'admin-hotel-assign-volunteer-delete',
    AdminHotelBookingCreate = 'admin-hotel-booking-create',
    AdminHotelBookingDelete = 'admin-hotel-booking-delete',
    AdminHotelBookingUpdate = 'admin-hotel-booking-update',
    AdminImpersonateVolunteer = 'admin-impersonate-volunteer',
    AdminNardoMutation = 'admin-nardo-mutation',
    AdminProgramMutation = 'admin-program-mutation',
    AdminRefundMutation = 'admin-refund-mutation',
    AdminResetAccessCode = 'admin-reset-access-code',
    AdminResetPasswordLink = 'admin-reset-password-link',
    AdminUpdateActivation = 'admin-update-activation',
    AdminUpdateAiSetting = 'admin-update-ai-settings',
    AdminUpdateAnimeConIntegration = 'admin-update-animecon-integration',
    AdminUpdateAvailabilityPreferences = 'admin-update-availability-preferences',
    AdminUpdateAvatar = 'admin-update-avatar',
    AdminUpdateEmailIntegration = 'admin-update-email-integration',
    AdminUpdateEvent = 'admin-update-event',
    AdminUpdateGoogleIntegration = 'admin-update-google-integration',
    AdminUpdateHotelPreferences = 'admin-update-hotel-preferences',
    AdminUpdatePermission = 'admin-update-permission',
    AdminUpdatePromptIntegration = 'admin-update-prompt-integration',
    AdminUpdateRefundRequest = 'admin-update-refund-request',
    AdminUpdateRole = 'admin-update-role',
    AdminUpdateTeam = 'admin-update-team',
    AdminUpdateTeamVolunteer = 'admin-update-team-volunteer',
    AdminUpdateTeamVolunteerStatus = 'admin-update-team-volunteer-status',
    AdminUpdateTrainingPreferences = 'admin-update-training-preferences',
    AdminUpdateVertexIntegration = 'admin-update-vertex-integration',
    AdminUpdateVolunteer = 'admin-update-volunteer',
    AdminVendorMutation = 'admin-vendor-mutation',
    ApplicationAvailabilityPreferences = 'application-availability-preferences',
    ApplicationHotelPreferences = 'application-hotel-preferences',
    ApplicationRefundRequest = 'application-refund-request',
    ApplicationTrainingPreferences = 'application-training-preferences',
    DatabaseError = 'database-error',
    EventApplication = 'event-application',
    ExportDataAccess = 'export-data-access',
}

/**
 * Information about what happened that should be logged for future inspection. Not all fields are
 * necessary, but a basic log entry has a severity and a type.
 */
export interface LogEntry {
    /**
     * Data pertaining to the cause of the entry, if applicable. Will be stored as JSON.
     */
    data?: any;

    /**
     * Severity of the log entry that's being logged. Defaults to "Info".
     */
    severity?: LogSeverity,

    /**
     * Information about the user who caused this log entry to be created.
     */
    sourceUser?: User | number;

    /**
     * The user about whom the log entry is being created.
     */
    targetUser?: User | number;

    /**
     * The type of log entry that's being written.
     */
    type: LogType;
}

/**
 * Logs the given `entry` to the database. Callers to this method must wait for this call to
 * complete in order to avoid concurrent queries running on the database.
 */
export async function Log(entry: LogEntry): Promise<void> {
    const { sourceUser, targetUser } = entry;

    let sourceUserId: number | null = null;
    if (sourceUser)
        sourceUserId = typeof sourceUser === 'number' ? sourceUser : sourceUser.userId;

    let targetUserId: number | null = null;
    if (targetUser)
        targetUserId = typeof targetUser === 'number' ? targetUser : targetUser.userId;

    const data = entry.data ? JSON.stringify(entry.data) : null;
    const severity = entry.severity ?? LogSeverity.Info;

    if (PlaywrightHooks.isActive() && PlaywrightHooks.isPlaywrightUser(sourceUserId, targetUserId))
        return;  // don't create log entries on behalf of Playwright users

    await db.insertInto(tLogs)
        .values({
            logType: entry.type,
            logSeverity: severity,
            logSourceUserId: sourceUserId,
            logTargetUserId: targetUserId,
            logData: data,
        }).executeInsert();
}

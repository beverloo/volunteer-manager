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
    AccountIdentifyPassword = 'account-identify-password',
    AccountPasswordResetRequest = 'account-password-reset-request',
    AccountPasswordReset = 'account-password-reset',
    AccountPasswordUpdate = 'account-password-update',
    AccountRegister = 'account-register',
    AccountUpdateAvatar = 'account-update-avatar',
    AdminAccessVolunteerInfo = 'admin-access-volunteer-info',
    AdminContentMutation = 'admin-content-mutation',
    AdminEventCreate = 'admin-event-create',
    AdminEventHotelMutation = 'admin-event-hotel',
    AdminEventPublishInfo = 'admin-event-publish-info',
    AdminEventRoleUpdate = 'admin-event-role-update',
    AdminEventTrainingMutation = 'admin-event-training',
    AdminEventTrainingExtraMutation = 'admin-event-training-extra',
    AdminHotelAssignVolunteer = 'admin-hotel-assign-volunteer',
    AdminHotelAssignVolunteerDelete = 'admin-hotel-assign-volunteer-delete',
    AdminHotelBookingCreate = 'admin-hotel-booking-create',
    AdminHotelBookingDelete = 'admin-hotel-booking-delete',
    AdminHotelBookingUpdate = 'admin-hotel-booking-update',
    AdminImpersonateVolunteer = 'admin-impersonate-volunteer',
    AdminResetAccessCode = 'admin-reset-access-code',
    AdminResetPasswordLink = 'admin-reset-password-link',
    AdminUpdateActivation = 'admin-update-activation',
    AdminUpdateAiSetting = 'admin-update-ai-settings',
    AdminUpdateAnimeConIntegration = 'admin-update-animecon-integration',
    AdminUpdateAvatar = 'admin-update-avatar',
    AdminUpdateEmailIntegration = 'admin-update-email-integration',
    AdminUpdateEvent = 'admin-update-event',
    AdminUpdateGoogleIntegration = 'admin-update-google-integration',
    AdminUpdateHotelPreferences = 'admin-update-hotel-preferences',
    AdminUpdatePermission = 'admin-update-permission',
    AdminUpdatePromptIntegration = 'admin-update-prompt-integration',
    AdminUpdateRole = 'admin-update-role',
    AdminUpdateTeam = 'admin-update-team',
    AdminUpdateTeamVolunteer = 'admin-update-team-volunteer',
    AdminUpdateTeamVolunteerStatus = 'admin-update-team-volunteer-status',
    AdminUpdateTrainingPreferences = 'admin-update-training-preferences',
    AdminUpdateVertexIntegration = 'admin-update-vertex-integration',
    AdminUpdateVolunteer = 'admin-update-volunteer',
    ApplicationHotelPreferences = 'application-hotel-preferences',
    ApplicationTrainingPreferences = 'application-training-preferences',
    DatabaseError = 'database-error',
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

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { User } from '@lib/auth/User';
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
    AdminEventHotelCreate = 'admin-event-hotel-create',
    AdminEventHotelDelete = 'admin-event-hotel-delete',
    AdminEventHotelUpdate = 'admin-event-hotel-update',
    AdminResetAccessCode = 'admin-reset-access-code',
    AdminResetPasswordLink = 'admin-reset-password-link',
    AdminUpdateActivation = 'admin-update-activation',
    AdminUpdateGoogleIntegration = 'admin-update-google-integration',
    AdminUpdatePermission = 'admin-update-permission',
    AdminUpdatePromptIntegration = 'admin-update-prompt-integration',
    AdminUpdateVertexIntegration = 'admin-update-vertex-integration',
    AdminUpdateVolunteer = 'admin-update-volunteer',
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

    await db.insertInto(tLogs)
        .values({
            logType: entry.type,
            logSeverity: severity,
            logSourceUserId: sourceUserId,
            logTargetUserId: targetUserId,
            logData: data,
        }).executeInsert();
}

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { User } from '@lib/auth/User';
import { sql } from '@lib/database';

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
    AdminUpdateActivation = 'admin-update-activation',
    AdminUpdatePermission = 'admin-update-permission',
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
    severity?: 'Debug' | 'Info' | 'Warning' | 'Error',

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
 * Logs the given `entry` to the database. Callers to this method may choose to wait for the log
 * operation to complete, however, that's not required as NextJS will happily process it after the
 * response has been returned to the user.
 */
export async function Log(entry: LogEntry) {
    const { sourceUser, targetUser } = entry;

    let sourceUserId = null;
    if (sourceUser)
        sourceUserId = typeof sourceUser === 'number' ? sourceUser : sourceUser.userId;

    let targetUserId = null;
    if (targetUser)
        targetUserId = typeof targetUser === 'number' ? targetUser : targetUser.userId;

    const data = entry.data ? JSON.stringify(entry.data) : null;
    const severity = entry.severity ?? 'Info';

    return sql`
        INSERT INTO
            logs
            (log_type, log_severity, log_source_user_id, log_target_user_id, log_data)
        VALUES
            (${entry.type}, ${severity}, ${sourceUserId}, ${targetUserId}, ${data})`;
}

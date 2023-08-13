// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type LogEntry, LogSeverity, LogType } from './Log';
import { sql } from './database';

/**
 * Interface that defines the format for log messages as it can be presented in the user interface.
 */
export interface LogMessage {
    /**
     * Arbitrary data that was included with the log message.
     */
    data?: any;

    /**
     * Date at which the log message was stored in the database.
     */
    date: Date;

    /**
     * Unique ID of this log entry. No need to show this to the user.
     */
    id: number;

    /**
     * Textual representation of what happened during this log message.
     */
    message: string;

    /**
     * Severity of the log message as it was issued.
     */
    severity: LogSeverity;

    /**
     * Source of the person or entity who issued the log message, if any.
     */
    source?: { userId: number; name: string };

    /**
     * Target of the person of entity about who the log message was issued, if any.
     */
    target?: { userId: number; name: string };
}

/**
 * Signature of log message formatting functions that can be used in the table below.
 */
type LogMessageFormatFn =
    (source: LogMessage['source'], target: LogMessage['target'], data: LogMessage['data'])
        => string;

/**
 * Formatting rules for each of the log message types. Strings with a series of special placeholders
 * may be used, alternatively a function may be used for more advanced processing.
 */
const kLogMessageFormatter: { [key in LogType]: string | LogMessageFormatFn } = {
    [LogType.AccountActivate]: 'Activated their account',
    [LogType.AccountIdentifyAccessCode]: 'Signed in using an access code',
    [LogType.AccountIdentifyPassword]: 'Signed in using a password',
    [LogType.AccountPasswordResetRequest]: 'Requested their password to be reset',
    [LogType.AccountPasswordReset]: 'Reset their password',
    [LogType.AccountPasswordUpdate]: 'Updated their password',
    [LogType.AccountRegister]: 'Created their account',
    [LogType.AccountUpdateAvatar]: 'Uploaded a new avatar',
    [LogType.AdminEventHotelCreate]: (source, target, { eventName }) => {
        return `Created a new hotel room for ${eventName}`;
    },
    [LogType.AdminEventHotelDelete]: (source, target, { eventName }) => {
        return `Deleted a hotel room for ${eventName}`;
    },
    [LogType.AdminEventHotelUpdate]: (source, target, { eventName }) => {
        return `Update a hotel room for ${eventName}`;
    },
    [LogType.AdminResetAccessCode]: 'Created a new access code',
    [LogType.AdminResetPasswordLink]: 'Created a new password reset link',
    [LogType.AdminUpdateActivation]: (source, target, data) => {
        return data.activated ? 'Activated their account'
                              : 'Deactivated their account';
    },
    [LogType.AdminUpdatePermission]: 'Updated their permissions',
    [LogType.AdminUpdateVolunteer]: 'Updated their user information',
    [LogType.DatabaseError]: 'Database error',
};

/**
 * Parameters that can be passed to the fetchLogs() function.
 */
export interface FetchLogsParams {
    /**
     * Maximum number of messages to fetch. Defaults to 100.
     */
    limit?: number;

    /**
     * Message severity to consider. Defaults to [Info, Warning, Error].
     */
    severity?: Exclude<LogEntry['severity'], null | undefined>[];

    /**
     * The User ID who was either the source or the target of the log message.
     */
    sourceOrTargetUserId?: number;

    /**
     * Result index at which to start the results. Defaults to 0.
     */
    start?: number;
}

/**
 * The response that a call to fetchLogs() can expect.
 */
export interface FetchLogsResponse {
    /**
     * Total number of log messages that could be fetched, ignoring limitations.
     */
    messageCount: number;

    /**
     * All messages that were returned from the query.
     */
    messages: LogMessage[];
}

/**
 * Fetches and formats log messages from the database in accordance with the `params`. Defaults will
 * apply where applicable. Returns zero or more messages.
 */
export async function fetchLogs(params: FetchLogsParams): Promise<FetchLogsResponse> {
    const limit = params.limit ?? 100;
    const severity = params.severity ?? [ 'Info', 'Warning', 'Error' ];
    const sourceOrTargetUserId = params.sourceOrTargetUserId ?? -1;
    const start = params.start ?? 0;

    const [ result, totalResult ] = await Promise.all([
        // -----------------------------------------------------------------------------------------
        // Primary query to fetch the entries
        // -----------------------------------------------------------------------------------------
        sql`SELECT
                logs.log_id,
                logs.log_date,
                logs.log_type,
                logs.log_severity,
                logs.log_source_user_id,
                CONCAT(a.first_name, " ", a.last_name) AS log_source_user_name,
                logs.log_target_user_id,
                CONCAT(b.first_name, " ", b.last_name) AS log_target_user_name,
                logs.log_data
            FROM
                logs
            LEFT JOIN
                users a ON a.user_id = logs.log_source_user_id
            LEFT JOIN
                users b ON b.user_id = logs.log_target_user_id
            WHERE
                log_severity IN (${severity}) AND
                (
                    ${sourceOrTargetUserId} = -1 OR
                    (
                        logs.log_source_user_id = ${sourceOrTargetUserId} OR
                        logs.log_target_user_id = ${sourceOrTargetUserId}
                    )
                )
            ORDER BY
                log_date DESC
            LIMIT
                ${start}, ${limit}`,

        // -----------------------------------------------------------------------------------------
        // Secondary query to count the number of entries
        // -----------------------------------------------------------------------------------------
        sql`SELECT
                COUNT(*) AS total
            FROM
                logs
            LEFT JOIN
                users a ON a.user_id = logs.log_source_user_id
            LEFT JOIN
                users b ON b.user_id = logs.log_target_user_id
            WHERE
                log_severity IN (${severity}) AND
                (
                    ${sourceOrTargetUserId} = -1 OR
                    (
                        logs.log_source_user_id = ${sourceOrTargetUserId} OR
                        logs.log_target_user_id = ${sourceOrTargetUserId}
                    )
                )`,
    ]);

    if (!result.ok || !result.rows.length || !totalResult.ok || !totalResult.rows.length)
        return { messageCount: 0, messages: [ /* database error */ ] };

    const logs: LogMessage[] = [];
    for (const row of result.rows) {
        const data = row.log_data ? JSON.parse(row.log_data) : undefined;

        // @ts-ignore
        const formatter = kLogMessageFormatter[row.log_type];

        let source = undefined;
        if (row.log_source_user_name)
            source = { userId: row.log_source_user_id, name: row.log_source_user_name };

        let target = undefined;
        if (row.log_target_user_name)
            target = { userId: row.log_target_user_id, name: row.log_target_user_name };

        let message: string;
        switch (typeof formatter) {
            case 'function':
                message = formatter(source, target, data);
                break;

            case 'string':
                message = formatter;
                break;

            default:
                message = row.log_type;
                break;
        }

        logs.push({
            data,
            date: row.log_date,
            id: row.log_id,
            message,
            severity: row.log_severity,
            source, target,
        });
    }

    return {
        messageCount: totalResult.rows[0].total,
        messages: logs,
    };
}

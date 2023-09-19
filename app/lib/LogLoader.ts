// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type LogEntry, LogSeverity, LogType } from './Log';
import db, { tLogs, tUsers } from './database';

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
    [LogType.AdminAccessVolunteerInfo]: (source, target) => {
        return `Accessed contact information for ${target?.name}`;
    },
    [LogType.AdminContentMutation]: (source, target, { mutation, context }) => {
        return `${mutation} page ${context}`;
    },
    [LogType.AdminEventCreate]: (source, target, { event }) => `Created the ${event} event`,
    [LogType.AdminEventHotelMutation]: (source, target, { eventName, mutation }) => {
        return `${mutation} a new hotel room for ${eventName}`;
    },
    [LogType.AdminEventPublishInfo]: (source, target, { event, published, type }) => {
        return `${published ? 'Published' : 'Unpublished'} ${type} information for ${event}`;
    },
    [LogType.AdminEventRoleUpdate]: (source, target, { role }) => {
        return `Updated their role to ${role} for an event`;
    },
    [LogType.AdminEventTrainingMutation]: (source, target, { eventName, mutation }) => {
        return `${mutation} a new training session for ${eventName}`;
    },
    [LogType.AdminEventTrainingExtraMutation]: (source, target, { eventName, mutation }) => {
        return `${mutation} an extra participant to ${eventName} trainings`;
    },

    [LogType.AdminHotelAssignVolunteer]: (source, target, { event }) => {
        return `Assigned ${target?.name} a hotel room for ${event}`;
    },
    [LogType.AdminHotelAssignVolunteerDelete]: (source, target, { event }) => {
        return `Removed ${target?.name}'s hotel room for ${event}`;
    },

    [LogType.AdminHotelBookingCreate]: (source, target, { event }) => {
        return `Created a new hotel assignment for ${event}`;
    },
    [LogType.AdminHotelBookingDelete]: (source, target, { event }) => {
        return `Deleted a hotel assignment for ${event}`;
    },
    [LogType.AdminHotelBookingUpdate]: (source, target, { event }) => {
        return `Updated a hotel assignment for ${event}`;
    },

    [LogType.AdminResetAccessCode]: (source, target, data) => {
        return `Created a new access code for ${target?.name}`;
    },
    [LogType.AdminResetPasswordLink]: (source, target, data) => {
        return `Created a new password reset link for ${target?.name}`;
    },
    [LogType.AdminUpdateActivation]: (source, target, data) => {
        return data.activated ? `Activated the account of ${target?.name}`
                              : `Deactivated their account of ${target?.name}`;
    },
    [LogType.AdminUpdateAnimeConIntegration]: 'Updated the integration settings for AnimeCon',
    [LogType.AdminUpdateEvent]: (source, target, { action, event }) => {
        return `Updated ${action ?? 'settings'} for ${event}`;
    },
    [LogType.AdminUpdateGoogleIntegration]: 'Updated the integration settings for Google',
    [LogType.AdminUpdateHotelPreferences]: (source, target, { event }) => {
        return `Updated their hotel preferences for ${event}`;
    },
    [LogType.AdminUpdatePermission]: (source, target, data) => {
        return `Updated the permissions of ${target?.name}`;
    },
    [LogType.AdminUpdatePromptIntegration]: 'Updated the Vertex AI LLM prompts',
    [LogType.AdminUpdateRole]: (source, target, { role }) => `Updated the ${role} role settings`,
    [LogType.AdminUpdateTeam]: (source, target, { team }) => `Updated the ${team} team settings`,
    [LogType.AdminUpdateVertexIntegration]: 'Updated the integration settings for Vertex AI',
    [LogType.AdminUpdateVolunteer]: (source, target, data) => {
        return `Updated the user information of ${target?.name}`;
    },
    [LogType.AdminUpdateTeamVolunteer]: (source, target, data) => {
        return `Updated event preferences for ${target?.name}`;
    },
    [LogType.ApplicationHotelPreferences]: (source, target, { event }) => {
        return `Updated their hotel preferences for ${event}`;
    },
    [LogType.DatabaseError]: (source, target, { query }) => {
        const normalizedQuery = query.trim().replace(/\s{2,}/g, ' ').substring(0, 32);
        return `Database error: "${normalizedQuery}"…`;
    },
};

/**
 * Sort item indicating a sorting priority for the log items.
 */
export interface LogsSortItem {
    /**
     * The field on which the sort should be applied.
     */
    field: 'date' | 'severity' | 'source' | 'target';

    /**
     * The direction of sorting that should be considered.
     */
    sort?: 'asc' | 'desc' | null;
}

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

    /**
     * Sort model to apply for the returned log items. Defaults to date, in descending order.
     */
    sortModel?: LogsSortItem[];
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
 * Normalizes the sort model based on the request's input, to something that the database is able to
 * deal with. The sort model will be applied in the query.
 */
function normalizeSortModel(sortModel?: LogsSortItem[]): string {
    const sortItems: string[] = [];
    for (const { field, sort } of sortModel ?? [ { field: 'date', sort: 'desc' }]) {
        let column: string;
        switch (field) {
            case 'date':
            case 'severity':
                column = field;
                break;

            case 'source':
                column = 'sourceUserName';
                break;

            case 'target':
                column = 'targetUserName';
                break;

            default:
                throw new Error(`Unrecognised field: ${field}`);
        }

        let order: string;
        switch (sort) {
            case 'asc':
            case 'desc':
            case undefined:
                order = sort ?? 'asc';
                break;

            case null:
                order = 'asc nulls last';
                break;

            default:
                throw new Error(`Unrecognised sort order: ${sort}`);
        }

        sortItems.push(`${column} ${order}`);
    }

    if (!sortItems.length)
        return 'date asc';

    return sortItems.join(', ');
}

/**
 * Fetches and formats log messages from the database in accordance with the `params`. Defaults will
 * apply where applicable. Returns zero or more messages.
 */
export async function fetchLogs(params: FetchLogsParams): Promise<FetchLogsResponse> {
    const sourceUserJoin = tUsers.forUseInLeftJoinAs('source');
    const targetUserJoin = tUsers.forUseInLeftJoinAs('target');

    let selectQueryBuilder = db.selectFrom(tLogs)
        .leftJoin(sourceUserJoin).on(sourceUserJoin.userId.equals(tLogs.logSourceUserId))
        .leftJoin(targetUserJoin).on(targetUserJoin.userId.equals(tLogs.logTargetUserId))
        .select({
            // Columns that will be passed through:
            date: tLogs.logDate,
            id: tLogs.logId,
            severity: tLogs.logSeverity,

            // Columns that will be processed:
            logData: tLogs.logData,
            logType: tLogs.logType,

            // Source user:
            sourceUserId: tLogs.logSourceUserId,
            sourceUserName: sourceUserJoin.firstName.concat(' ').concat(sourceUserJoin.lastName),

            // Target user:
            targetUserId: tLogs.logTargetUserId,
            targetUserName: targetUserJoin.firstName.concat(' ').concat(targetUserJoin.lastName),
        })
        .orderByFromString(normalizeSortModel(params.sortModel))
        .limit(params.limit ?? 100)
        .offsetIfValue(params.start)
        .where(tLogs.logSeverity.in(
            params.severity ?? [ LogSeverity.Info, LogSeverity.Warning, LogSeverity.Error ]));

    if (params.sourceOrTargetUserId) {
        selectQueryBuilder = selectQueryBuilder
            .and(tLogs.logSourceUserId.equals(params.sourceOrTargetUserId)
                .or(tLogs.logTargetUserId.equals(params.sourceOrTargetUserId)));
    }

    const { count, data } = await selectQueryBuilder.executeSelectPage();
    if (!count)
        return { messageCount: 0, messages: [ /* database error */ ] };

    const logs: LogMessage[] = [];
    for (const row of data) {
        const formatter = kLogMessageFormatter[row.logType as keyof typeof kLogMessageFormatter];
        const data = row.logData ? JSON.parse(row.logData) : undefined;

        let source = undefined;
        if (row.sourceUserId && row.sourceUserName)
            source = { userId: row.sourceUserId, name: row.sourceUserName };

        let target = undefined;
        if (row.targetUserId && row.targetUserName)
            target = { userId: row.targetUserId, name: row.targetUserName };

        let message: string;
        switch (typeof formatter) {
            case 'function':
                message = formatter(source, target, data);
                break;

            case 'string':
                message = formatter;
                break;

            default:
                message = row.logType;
                break;
        }

        logs.push({
            data,
            date: row.date,
            id: row.id,
            message,
            severity: row.severity,
            source, target,
        });
    }

    return {
        messageCount: count,
        messages: logs,
    };
}

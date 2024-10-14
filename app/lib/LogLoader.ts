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
     * Date at which the log message was stored in the database, in UTC formatted in a Temporal
     * ZonedDateTime-compatible format.
     */
    date: string;

    /**
     * Unique ID of this log entry. No need to show this to the user.
     */
    id: number;

    /**
     * Type of log that's been issued. This will be used to determine the message that should be.
     * Deliberately not typed according to `LogType` as old entries may be included.
     */
    type: string;

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
 * Enumeration containing log types that have been deprecated. We still want to be able to display
 * the origin log messages in a formatted manner, but autocomplete doesn't have to care.
 */
enum DeprecatedLogType {
    AdminHotelBookingCreate = 'admin-hotel-booking-create',
    AdminHotelBookingDelete = 'admin-hotel-booking-delete',
    AdminHotelBookingUpdate = 'admin-hotel-booking-update',
    AdminUpdateAnimeConIntegration = 'admin-update-animecon-integration',
    AdminUpdateEmailIntegration = 'admin-update-email-integration',
    AdminUpdateGoogleIntegration = 'admin-update-google-integration',
    AdminUpdatePromptIntegration = 'admin-update-prompt-integration',
    AdminUpdateVertexIntegration = 'admin-update-vertex-integration',
    AdminWhatsAppMutation = 'admin-whatsapp-mutation',
};

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
const kLogMessageFormatter: {
    [ key in (DeprecatedLogType | LogType) ]: string | LogMessageFormatFn
} = {
    [LogType.AccountActivate]: 'Activated their account',
    [LogType.AccountIdentifyAccessCode]: 'Signed in using an access code',
    [LogType.AccountIdentifyPasskey]: 'Signed in using a passkey',
    [LogType.AccountIdentifyPassword]: 'Signed in using a password',
    [LogType.AccountIdentityCheck]: (source, target, { username }) => {
        return `Confirmed existence of an account (${username})`;
    },
    [LogType.AccountPasskeyCreate]: 'Created a passkey for their account',
    [LogType.AccountPasskeyDelete]: 'Deleted a passkey from their account',
    [LogType.AccountPasswordResetRequest]: 'Requested their password to be reset',
    [LogType.AccountPasswordReset]: 'Reset their password',
    [LogType.AccountPasswordUpdate]: 'Updated their password',
    [LogType.AccountRegister]: 'Created their account',
    [LogType.AccountUpdateAvatar]: 'Uploaded a new avatar',
    [LogType.AccountUpdate]: 'Updated their account information',
    [LogType.AdminAccessVolunteerInfo]: (source, target) => {
        return `Accessed contact information for ${target?.name}`;
    },
    [LogType.AdminClearHotelPreferences]: (source, target, { event }) => {
        return `Cleared ${target?.name}'s hotel preferences for ${event}`;
    },
    [LogType.AdminClearRefundRequest]: (source, target, { event }) => {
        return `Cleared ${target?.name}'s refund request for ${event}`;
    },
    [LogType.AdminClearTrainingPreferences]: (source, target, { event }) => {
        return `Cleared ${target?.name}'s training preferences for ${event}`;
    },
    [LogType.AdminContentMutation]: (source, target, { mutation, context }) => {
        return `${mutation} page ${context}`;
    },
    [LogType.AdminDisplayMutation]: (source, target, { mutation, identifier, label }) => {
        return `${mutation} the "${identifier}" physical display` + (!!label ? ` (${label})` : '');
    },
    [LogType.AdminEventApplication]: (source, target, { event }) => {
        return `Applied for ${target?.name} to participate in ${event}`;
    },
    [LogType.AdminEventCreate]: (source, target, { event }) => `Created the ${event} event`,
    [LogType.AdminEventDeadlineMutation]: (source, target, { event, mutation }) => {
        return `${mutation} a deadline for ${event}`;
    },
    [LogType.AdminEventHotelMutation]: (source, target, { eventName, mutation }) => {
        return `${mutation} an hotel room for ${eventName}`;
    },
    [LogType.AdminEventProgramRequestUpdate]: (source, target, { activity, event }) => {
        return `Updated the "${activity}" program request for ${event}`;
    },
    [LogType.AdminEventPublishInfo]: (source, target, { event, published, type }) => {
        return `${published ? 'Published' : 'Unpublished'} ${type} information for ${event}`;
    },
    [LogType.AdminEventRetentionUpdate]: (source, target, { event }) => {
        return `Updated ${event} retention for ${target?.name}`;
    },
    [LogType.AdminEventRoleUpdate]: (source, target, { role }) => {
        return `Updated their role to ${role} for an event`;
    },
    [LogType.AdminEventShiftCategoryMutation]: (source, target, { category, mutation }) => {
        return `${mutation} the "${category}" shift category`;
    },
    [LogType.AdminEventShiftMutation]: (source, target, { event, mutation, shift, team }) => {
        return `${mutation} the "${shift}" ${team} shift for ${event}`;
    },
    [LogType.AdminEventTeamUpdate]: (source, target, { sourceTeam, targetTeam }) => {
        return `Moved ${target?.name} from the ${sourceTeam} to the ${targetTeam}`;
    },
    [LogType.AdminEventTrainingAssignment]: (source, target, { eventName }) => {
        return target ? `Updated ${target.name}'s training assignment for ${eventName}`
                      : `Updated a training assignment for ${eventName}`;
    },
    [LogType.AdminEventTrainingMutation]: (source, target, { eventName, mutation }) => {
        return `${mutation} a training session for ${eventName}`;
    },
    [LogType.AdminEventTrainingExtraMutation]: (source, target, { eventName, mutation }) => {
        return `${mutation} an extra participant to ${eventName} trainings`;
    },

    [LogType.AdminExportMutation]: (source, target, { eventName, type, mutation }) => {
        return `${mutation} a ${type.replace(/s$/, '').toLowerCase()} data export for ${eventName}`;
    },

    [LogType.AdminHotelAssignVolunteer]: (source, target, { event }) => {
        return `Assigned ${target?.name} to a hotel room for ${event}`;
    },
    [LogType.AdminHotelAssignVolunteerDelete]: (source, target, { event }) => {
        return `Removed ${target?.name}'s hotel room for ${event}`;
    },
    [LogType.AdminHotelBookingMutation]: (source, target, { event, mutation }) => {
        return `${mutation} an hotel assignment for ${event}`;
    },
    [LogType.AdminImpersonateVolunteer]: (source, target, data) => {
        return `Impersonated ${target?.name}'s account`;
    },
    [LogType.AdminKnowledgeBaseCategoryMutation]: (_, __, { mutation, event, category }) => {
        return `${mutation} the "${category}" knowledge base category for ${event}`;
    },
    [LogType.AdminKnowledgeBaseMutation]: (source, target, { mutation, event, question }) => {
        return `${mutation} the "${question}" question for ${event}`;
    },

    [LogType.AdminNardoMutation]: (source, target, { mutation }) => {
        return `${mutation} an excellent piece of Del a Rie Advies`;
    },

    [LogType.AdminProgramMutation]: (source, target, { event, entityType, entity, mutation }) => {
        return `${mutation} the "${entity}" ${entityType} for ${event}`;
    },

    [LogType.AdminRefundMutation]: (source, target, { event }) => {
        return `Updated ${target?.name}'s refund status for ${event}`;
    },

    [LogType.AdminResetAccessCode]: (source, target, data) => {
        return `Created a new access code for ${target?.name}`;
    },
    [LogType.AdminResetPasswordLink]: (source, target, data) => {
        return `Created a new password reset link for ${target?.name}`;
    },
    [LogType.AdminSubscriptionUpdate]: (source, target) => {
        return `Updated the subscriptions for ${target?.name}`;
    },
    [LogType.AdminUpdateActivation]: (source, target, data) => {
        return data.activated ? `Activated the account of ${target?.name}`
                              : `Deactivated their account of ${target?.name}`;
    },
    [LogType.AdminUpdateAiSetting]: (source, target, { setting }) => {
        return `Updated the generative AI ${setting}`;
    },
    [LogType.AdminUpdateAvailabilityPreferences]: (source, target, { event }) => {
        return `Updated their availability preferences for ${event}`;
    },
    [LogType.AdminUpdateEvent]: (source, target, { action, event }) => {
        return `Updated ${action ?? 'settings'} for ${event}`;
    },
    [LogType.AdminUpdateAvatar]: (source, target) => `Updated ${target?.name}'s avatar`,
    [LogType.AdminUpdateEnvironment]: 'Updated Volunteer Manager environment configuration',
    [LogType.AdminUpdateHotelPreferences]: (source, target, { event }) => {
        return `Updated their hotel preferences for ${event}`;
    },
    [LogType.AdminUpdateIntegration]: (source, target, { integration }) => {
        return `Updated the ${integration} integration settings`;
    },
    [LogType.AdminUpdatePermission]: (source, target, data) => {
        return `Updated the permissions of ${target?.name}`;
    },
    [LogType.AdminUpdateRefundRequest]: (source, target, { event }) => {
        return `Updated ticket refund settings for ${target?.name} during ${event}`;
    },
    [LogType.AdminUpdateRole]: (source, target, { role }) => `Updated the ${role} role settings`,
    [LogType.AdminUpdateSettings]: 'Updated the Volunteer Manager settings',
    [LogType.AdminUpdateTeam]: (source, target, { team }) => `Updated the ${team} team settings`,
    [LogType.AdminUpdateTrainingPreferences]: (source, target, { event }) => {
        return `Updated their training preferences for ${event}`;
    },
    [LogType.AdminUpdateVolunteer]: (source, target, data) => {
        return `Updated the user information of ${target?.name}`;
    },
    [LogType.AdminVendorMutation]: (source, target, { event, mutation, team }) => {
        return `${mutation} a ${team} vendor for ${event}`;
    },
    [LogType.AdminVendorScheduleUpdate]: (start, target, { event, team }) => {
        return `Updated the ${team} schedule for ${event}`;
    },
    [LogType.AdminUpdateTeamVolunteer]: (source, target, data) => {
        return `Updated event preferences for ${target?.name}`;
    },
    [LogType.AdminUpdateTeamVolunteerStatus]: (source, target, { action, event }) => {
        return `${action} ${target?.name}'s participation in ${event}`;
    },
    [LogType.ApplicationAvailabilityPreferences]: (source, target, { event }) => {
        return `Updated their availability preferences for ${event}`;
    },
    [LogType.ApplicationHotelPreferences]: (source, target, { event }) => {
        return `Updated their hotel preferences for ${event}`;
    },
    [LogType.ApplicationRefundRequest]: (source, target, { event }) => {
        return `Requested a refund for their ${event} ticket`;
    },
    [LogType.ApplicationTrainingPreferences]: (source, target, { event }) => {
        return `Updated their training preferences for ${event}`;
    },

    [LogType.DatabaseError]: (source, target, { query }) => {
        const normalizedQuery = query.trim().replace(/\s{2,}/g, ' ').substring(0, 32);
        return `Database error: "${normalizedQuery}"…`;
    },

    [LogType.EventApplication]: (source, target, { event }) => `Applied to participate in ${event}`,
    [LogType.EventFeedbackSubmitted]: 'Submitted feedback through the Volunteer Portal',
    [LogType.EventHelpRequestUpdate]: (source, target, { event, display, mutation }) => {
        return `${mutation} a help request from ${display} for ${event}`;
    },
    [LogType.EventVolunteerNotes]: (source, target, { event }) => {
        return `Updated notes for ${target?.name} during ${event}`;
    },

    [LogType.ExportDataAccess]: (source, target, { event, type }) => {
        return `Accessed exported ${event} ${type} data`;
    },

    // ---------------------------------------------------------------------------------------------
    // Deprecated
    // ---------------------------------------------------------------------------------------------

    [DeprecatedLogType.AdminHotelBookingCreate]: (source, target, { event }) => {
        return `Created a new hotel assignment for ${event}`;
    },
    [DeprecatedLogType.AdminHotelBookingDelete]: (source, target, { event }) => {
        return `Deleted a hotel assignment for ${event}`;
    },
    [DeprecatedLogType.AdminHotelBookingUpdate]: (source, target, { event }) => {
        return `Updated a hotel assignment for ${event}`;
    },
    [DeprecatedLogType.AdminUpdateAnimeConIntegration]:
        'Updated the integration settings for AnimeCon',
    [DeprecatedLogType.AdminUpdateEmailIntegration]: 'Updated the e-mail integration settings',
    [DeprecatedLogType.AdminUpdateGoogleIntegration]: 'Updated the integration settings for Google',
    [DeprecatedLogType.AdminUpdatePromptIntegration]: 'Updated the Vertex AI LLM prompts',
    [DeprecatedLogType.AdminUpdateVertexIntegration]:
        'Updated the integration settings for Vertex AI',
    [DeprecatedLogType.AdminWhatsAppMutation]: (source, target, { mutation }) => {
        return `${mutation} a WhatsApp notification recipient`;
    },
};

/**
 * Sort model to apply for the returned log items.
 */
interface FetchLogsSort {
    field: 'id' | 'data' | 'date' | 'message' | 'severity' | 'source' | 'target' | 'type';
    sort: 'asc' | 'desc' | null;
}

/**
 * Parameters that can be passed to the fetchLogs() function.
 */
interface FetchLogsParams {
    /**
     * Message severity to consider. Defaults to [Info, Warning, Error].
     */
    severity?: Exclude<LogEntry['severity'], null | undefined>[];

    /**
     * The User ID who was either the source or the target of the log message.
     */
    sourceOrTargetUserId?: number;

    /**
     * Sort model to apply for the returned log items. Defaults to date, in descending order.
     */
    sort?: FetchLogsSort;

    /**
     * Pagination that should be applied to the logs data request.
     */
    pagination?: {
        page: number;
        pageSize: number;
    },
}

/**
 * The response that a call to fetchLogs() can expect.
 */
interface FetchLogsResponse {
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
function normalizeSortModel(sortModel?: FetchLogsSort): string {
    const { field, sort } = sortModel ?? { field: 'date', sort: 'asc' };

    let column: string;
    switch (field) {
        case 'id':
        case 'data':
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

        case 'type':
            column = 'logType';
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

    return `${column} ${order}`;
}

/**
 * Fetches and formats log messages from the database in accordance with the `params`. Defaults will
 * apply where applicable. Returns zero or more messages.
 */
export async function fetchLogs(params: FetchLogsParams): Promise<FetchLogsResponse> {
    const sourceUserJoin = tUsers.forUseInLeftJoinAs('source');
    const targetUserJoin = tUsers.forUseInLeftJoinAs('target');

    const dbInstance = db;
    let selectQueryBuilder = dbInstance.selectFrom(tLogs)
        .leftJoin(sourceUserJoin).on(sourceUserJoin.userId.equals(tLogs.logSourceUserId))
        .leftJoin(targetUserJoin).on(targetUserJoin.userId.equals(tLogs.logTargetUserId))
        .select({
            // Columns that will be passed through:
            date: dbInstance.dateTimeAsString(tLogs.logDate),
            id: tLogs.logId,
            severity: tLogs.logSeverity,

            // Columns that will be processed:
            data: tLogs.logData,
            logType: tLogs.logType,

            // Source user:
            sourceUserId: tLogs.logSourceUserId,
            sourceUserName: sourceUserJoin.name,

            // Target user:
            targetUserId: tLogs.logTargetUserId,
            targetUserName: targetUserJoin.name,
        })
        .orderByFromString(normalizeSortModel(params.sort))
        .limitIfValue(params.pagination?.pageSize)
            .offsetIfValue(params.pagination ? params.pagination.page * params.pagination.pageSize
                                             : undefined)
        .where(tLogs.logDeleted.isNull())
            .and(tLogs.logSeverity.in(
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
        const data = row.data ? JSON.parse(row.data) : undefined;

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
            type: row.logType,
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

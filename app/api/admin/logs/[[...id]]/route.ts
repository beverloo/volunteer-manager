// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../createDataTableApi';
import { LogSeverity } from '@lib/Log';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { fetchLogs } from '@lib/LogLoader';
import db, { tLogs } from '@lib/database';

/**
 * Row model for a log message describing an event that happened on the Volunteer Manager.
 */
const kLogsRowModel = z.object({
    /**
     * Unique ID of this message.
     */
    id: z.number(),

    /**
     * Arbitrary data that was included with the log message.
     */
    data: z.any().optional(),

    /**
     * Date at which the log message was stored in the database.
     */
    date: z.string(),

    /**
     * Type of log message that was stored.
     */
    type: z.string(),

    /**
     * Textual representation of what happened during this log message.
     */
    message: z.string(),

    /**
     * The severity assigned to the log entry.
     */
    severity: z.nativeEnum(LogSeverity),

    /**
     * Source of the person or entity who issued the log message, if any.
     */
    source: z.strictObject({
        userId: z.number(),
        name: z.string(),
    }).optional(),

    /**
     * Target of the person of entity about who the log message was issued, if any.
     */
    target: z.strictObject({
        userId: z.number(),
        name: z.string(),
    }).optional(),
});

/**
 * This API does not require any context.
 */
const kLogsContext = z.object({
    context: z.object({
        /**
         * Included because the context for this endpoint may be conveyed through the URL, which
         * means that `userId`, being optional, cannot be the only field.
         */
        v: z.literal('1'),

        /**
         * Optional filter indicating for which user logs should be retrieved.
         */
        userId: z.coerce.number().optional(),
    }),
});

/**
 * Export type definitions so that the API can be used in `callApi()`.
 */
export type LogsEndpoints =
    DataTableEndpoints<typeof kLogsRowModel, typeof kLogsContext>;

/**
 * Export type definition for the API's Row Model.
 */
export type LogsRowModel = z.infer<typeof kLogsRowModel>;

/**
 * Export type definition for the API's context.
 */
export type LogsContext = z.infer<typeof kLogsContext>;

/**
 * This is implemented as a regular DataTable API. The following endpoints are provided by this
 * implementation:
 *
 *     GET /api/admin/logs
 *     DELETE /api/admin/logs/:id
 */
export const { DELETE, GET } = createDataTableApi(kLogsRowModel, kLogsContext, {
    async accessCheck({ context }, action, props) {
        switch (action) {
            case 'delete':
                executeAccessCheck(props.authenticationContext, {
                    check: 'admin',
                    permission: {
                        permission: 'system.logs',
                        operation: 'delete',
                    },
                });

                return;

            case 'list':
                executeAccessCheck(props.authenticationContext, {
                    check: 'admin',
                    permission: {
                        permission: 'system.logs',
                        operation: 'read',
                    },
                });

                return;
        }

        throw new Error(`Unexpected action on the logs endpoint: "${action}".`);
    },

    async delete({ id }) {
        const dbInstance = db;
        const affectedRows = await dbInstance.update(tLogs)
            .set({
                logDeleted: dbInstance.currentZonedDateTime(),
            })
            .where(tLogs.logId.equals(id))
            .executeUpdate();

        return { success: !!affectedRows };
    },

    async list({ context, pagination, sort }) {
        const response = await fetchLogs({
            sourceOrTargetUserId: context.userId,

            sort, pagination,

            severity: [
                LogSeverity.Debug,
                LogSeverity.Info,
                LogSeverity.Warning,
                LogSeverity.Error
            ],
        });

        return {
            success: true,
            rowCount: response.messageCount,
            rows: response.messages
        };
    },
});

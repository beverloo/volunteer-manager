// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { LogSeverity } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { fetchLogs } from '@lib/LogLoader';

/**
 * Interface definition for the Logs API, exposed through /api/admin/logs.
 */
export const kLogsDefinition = z.object({
    request: z.object({
        /**
         * Optional filters that may be provided to limit the results.
         */
        filters: z.object({
            /**
             * The user ID of either the source or target log entry.
             */
            sourceOrTargetUserId: z.number().optional(),

        }).optional(),

        /**
         * The page the user is currently navigating.
         */
        page: z.number(),

        /**
         * The number of entries that should be displayed on a single page.
         */
        pageSize: z.number(),

    }),
    response: z.strictObject({
        /**
         * The total number of log entries that were found given the input constraints.
         */
        rowCount: z.number(),

        /**
         * The rows applicable to the current page of the input constraints.
         */
        rows: z.array(z.strictObject({
            /**
             * Arbitrary data that was included with the log message.
             */
            data: z.any().optional(),

            /**
             * Date at which the log message was stored in the database.
             */
            date: z.date(),

            /**
             * Unique ID of this log entry. No need to show this to the user.
             */
            id: z.number(),

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

        })),
    }),
});

export type LogsDefinition = z.infer<typeof kLogsDefinition>;

type Request = LogsDefinition['request'];
type Response = LogsDefinition['response'];

/**
 * API that allows system administrators to retrieve system logs. There is no upper bound on the
 * number of available logs, so a server-side paginated system is used to find the most important
 * ones, while MUI <DataGrid> provides powerful filtering capabilities.
 */
export async function logs(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.SystemLogsAccess))
        noAccess();

    const response = await fetchLogs({
        sourceOrTargetUserId: request.filters?.sourceOrTargetUserId,
        limit: request.pageSize,
        severity: [
            LogSeverity.Debug,
            LogSeverity.Info,
            LogSeverity.Warning,
            LogSeverity.Error
        ],
        start: request.pageSize * request.page,
    });

    return {
        rowCount: response.messageCount,
        rows: response.messages,
    };
}

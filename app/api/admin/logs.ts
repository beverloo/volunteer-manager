// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { Privilege, can } from '@lib/auth/Privileges';
import { fetchLogs } from '@lib/LogLoader';

/**
 * Interface definition for the Logs API, exposed through /api/admin/logs. Only system admins have
 * the necessary permission to access this API.
 */
export const kLogsDefinition = z.object({
    request: z.object({
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
             * Unique ID of the log entry. Not presented to the user, but needed by <DataTable />.
             */
            id: z.number(),

            /**
             * The log message that
             */
            message: z.string(),

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
    if (!can(props.user, Privilege.SystemAdministrator))
        noAccess();

    const response = await fetchLogs({
        limit: request.pageSize,
        start: request.pageSize * request.page,
    });

    return {
        rowCount: 16,
        rows: response.map(entry => ({ id: entry.id, message: entry.message })),
    };
}

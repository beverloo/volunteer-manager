// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '@app/api/createDataTableApi';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { noAccess } from '@app/api/Action';

/**
 * Row model for an individual piece of advice offered by Del a Rie Advies.
 */
const kRetentionRowModel = z.object({
    /**
     * Unique ID assigned to this person in the retention table.
     */
    id: z.number(),
});

/**
 * The context required by the retention mechanism.
 */
const kRetentionContext = z.object({
    context: z.object({
        /**
         * Slug of the event for which retention is being managed.
         */
        event: z.string(),

        /**
         * Slug of the team for which retention is being managed.
         */
        team: z.string(),
    }),
});

/**
 * Context required by the retention management mechanism.
 */
export type RetentionContext = z.infer<typeof kRetentionContext>['context'];

/**
 * Export type definitions so that the Retention DataTable API can be used in `callApi()`.
 */
export type RetentionEndpoints =
    DataTableEndpoints<typeof kRetentionRowModel, typeof kRetentionContext>;

/**
 * Export type definition for the Retention DataTable API's Row Model.
 */
export type RetentionRowModel = z.infer<typeof kRetentionRowModel>;

/**
 * The Retention API is implemented as a regular, editable DataTable API.
 */
export const { GET, PUT } = createDataTableApi(kRetentionRowModel, kRetentionContext, {
    accessCheck({ context }, action, props) {
        switch (action) {
            case 'create':
            case 'delete':
            case 'get':
                noAccess();

            case 'list':
            case 'update':
                executeAccessCheck(props.authenticationContext, {
                    check: 'admin-event',
                    event: context.event,
                    privilege: Privilege.EventRetentionManagement,
                });

                break;
        }
    },

    async list({ pagination, sort }, props) {
        // Name
        // Most recent event
        // Status { Unknown, Claimed, Contacted, Declined, [ Accepted ] }
        // Assigned lead
        // Notes

        return {
            success: false,
            error: 'Not yet implemented',
        }
    },

    async update({ row }, props) {
        return {
            success: false,
            error: 'Not yet implemented',
        }
    },

    async writeLog(request, mutation, props) {

    },
});

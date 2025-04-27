// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { forbidden, unauthorized } from 'next/navigation';
import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../createDataTableApi';
import { RecordLog, kLogType } from '@lib/Log';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { readSettings } from '@lib/Settings';
import db, { tNardoPersonalised, tUsers } from '@lib/database';

/**
 * Row model for an individual piece of personalised advice offered by Del a Rie Advies.
 */
const kNardoPersonalisedRowModel = z.object({
    /**
     * Unique ID of the piece of personalised advice. Only exposed to administrators.
     */
    id: z.number().optional(),

    /**
     * Date and time at which the advice was generated. Only exposed to administrators.
     */
    date: z.string().optional(),

    /**
     * User ID of the user who requested this advice. Only exposed to administrators.
     */
    userId: z.number().optional(),

    /**
     * Name of the user who requested this advice. Only exposed to administrators.
     */
    userName: z.string().optional(),

    /**
     * Input to the personalised advice, i.e. what should be considered? Must be provided when new
     * advice is being generated; will only be exposed to administrators thereafter.
     */
    input: z.string().optional(),

    /**
     * The piece of personalised advice that has been created.
     */
    output: z.string(),
});

/**
 * The Personalised Nardo API does not require any context.
 */
const kNardoPersonalisedContext = z.never();

/**
 * Export type definitions so that the Nardo DataTable API can be used in `callApi()`.
 */
export type NardoPersonalisedEndpoints =
    DataTableEndpoints<typeof kNardoPersonalisedRowModel, typeof kNardoPersonalisedContext>;

/**
 * Export type definition for the Nardo DataTable API's Row Model.
 */
export type NardoPersonalisedRowModel = z.infer<typeof kNardoPersonalisedRowModel>;

/**
 * The Del a Rie Advies API is implemented as a regular, editable DataTable API. All operations are
 * gated on Nardo permission, and mutations will be logged as appropriate.
 */
export const { GET, POST } =
createDataTableApi(kNardoPersonalisedRowModel, kNardoPersonalisedContext, {
    accessCheck(request, action, props) {
        switch (action) {
            case 'create':
                if (!props.authenticationContext.user)
                    unauthorized();

                if (!props.authenticationContext.events.size)
                    forbidden();

                // This API is publicly available for any signed in user who is participating in at
                // least one unsuspended event. A check whether the feature is enabled is included
                // in the implementation of the `create()` function.
                break;

            case 'list':
                executeAccessCheck(props.authenticationContext, {
                    check: 'admin',
                    permission: 'system.nardo',
                });

                break;

            case 'delete':
            case 'get':
            case 'reorder':
            case 'update':
                throw new Error('Not supported by this API');
        }
    },

    async create(request, props) {
        const settings = await readSettings([
            'gen-ai-prompt-del-a-rie-advies',
            'schedule-del-a-rie-advies-genai',
        ]);

        if (!settings['schedule-del-a-rie-advies-genai'])
            forbidden();

        // TODO: Enable creating advice.

        return {
            success: false,
            error: 'Not yet implemented',
        }
    },

    async list({ pagination, sort }, props) {
        const dbInstance = db;
        const results = await dbInstance.selectFrom(tNardoPersonalised)
            .innerJoin(tUsers)
                .on(tUsers.userId.equals(tNardoPersonalised.nardoPersonalisedUserId))
            .select({
                id: tNardoPersonalised.nardoPersonalisedId,
                date: dbInstance.dateTimeAsString(tNardoPersonalised.nardoPersonalisedDate),
                userId: tUsers.userId,
                userName: tUsers.name,
                input: tNardoPersonalised.nardoPersonalisedInput,
                output: tNardoPersonalised.nardoPersonalisedOutput,
            })
            .orderByFromStringIfValue(sort ? `${sort.field} ${sort.sort}` : null)
            .limit(pagination ? pagination.pageSize : 50)
                .offsetIfValue(pagination ? pagination.page * pagination.pageSize : 0)
            .executeSelectPage();

        return {
            success: true,
            rowCount: results.count,
            rows: results.data,
        };
    },

    async writeLog(request, mutation, props) {
        if (mutation === 'Created') {
            RecordLog({
                type: kLogType.NardoPersonalisedAdvice,
                sourceUser: props.user!.userId,
                data: { id: request.id },
            });
        }
    },
});

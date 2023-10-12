// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest } from 'next/server';
import { z } from 'zod';

import type { DataTableListEndpoint } from '../createDataTableApi';
import { Privilege, can } from '@lib/auth/Privileges';
import { createAdvice, kCreateAdviceDefinition } from './createAdvice';
import { createDataTableApi } from '../createDataTableApi';
import { executeAction } from '@app/api/Action';
import db, { tNardo, tUsers } from '@lib/database';

/**
 * Row model for an individual piece of advice offered by Del a Rie Advies.
 */
const kNardoRowModel = z.object({
    /**
     * Unique ID of the piece of advice. Only exposed to administrators.
     */
    id: z.number().optional(),

    /**
     * The advice as issued on behalf of Del a Rie Advies.
     */
    advice: z.string(),

    /**
     * Name of the author of this advice. Only exposed to administrators.
     */
    authorName: z.string().optional(),

    /**
     * User ID of the author of this advice. Only exposed to administrators.
     */
    authorUserId: z.number().optional(),

    /**
     * Date and time at which the advice was updated. Only exposed to administrators.
     */
    date: z.string().optional(),
});

/**
 * The Nardo API does not require any context.
 */
const kNardoContext = z.never();

/**
 * Export type definitions so that the Nardo DataTable API can be used in `callApi()`.
 */
export type ListNardoDefinition =
    DataTableListEndpoint<typeof kNardoRowModel, typeof kNardoContext>;

/**
 * The Del a Rie advies API is implemented as a regular, editable DataTable API. All operations are
 * gated on the `Privilege.SystemNardoAccess` privilege, and changes will be logged as appropriate.
 */
export const { GET } = createDataTableApi(kNardoRowModel, kNardoContext, {
    accessCheck: (action) => {
        switch (action) {
            case 'list':
                // always allowed
                break;
        }
    },

    list: async ({ sort }, props) => {
        // TODO: Implement filtering
        // TODO: Implement pagination

        const publicView = !can(props.user, Privilege.SystemNardoAccess);
        const results = await db.selectFrom(tNardo)
            .innerJoin(tUsers)
                .on(tUsers.userId.equals(tNardo.nardoAuthorId))
            .where(tNardo.nardoVisible.equals(/* true= */ 1))
            .select({
                id: tNardo.nardoId,
                advice: tNardo.nardoAdvice,
                authorName: tUsers.firstName.concat(' ').concat(tUsers.lastName),
                authorUserId: tUsers.userId,
                date: tNardo.nardoAuthorDate,
            })
            .orderByFromStringIfValue(sort ? `${sort.field} ${sort.sort}` : null)
            .executeSelectPage();

        return {
            success: true,
            rowCount: results.count,
            rows: results.data.map(result =>
                publicView ? { advice: result.advice } :
                             { ...result, date: result.date.toISOString() }),
        }
    },
});

/**
 * POST /api/admin/nardo
 */
export async function POST(request: NextRequest): Promise<Response> {
    return executeAction(request, kCreateAdviceDefinition, createAdvice);
}

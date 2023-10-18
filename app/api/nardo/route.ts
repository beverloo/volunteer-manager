// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { DataTableEndpoints } from '../createDataTableApi';
import { LogType, Log } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { createDataTableApi } from '../createDataTableApi';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
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
export type NardoEndpoints = DataTableEndpoints<typeof kNardoRowModel, typeof kNardoContext>;

/**
 * Export type definition for the Nardo DataTable API's Row Model.
 */
export type NardoRowModel = z.infer<typeof kNardoRowModel>;

/**
 * The Del a Rie advies API is implemented as a regular, editable DataTable API. All operations are
 * gated on the `Privilege.SystemNardoAccess` privilege, and changes will be logged as appropriate.
 */
export const { GET, POST } = createDataTableApi(kNardoRowModel, kNardoContext, {
    accessCheck(request, action, props) {
        switch (action) {
            case 'create':
                executeAccessCheck(props.authenticationContext, {
                    check: 'admin',
                    privilege: Privilege.SystemNardoAccess,
                });

                break

            case 'list':
                // always allowed
                break;
        }
    },

    async create(request, props) {
        //const insertId = await db.insertInto(tNardo)
        //    .set({
        //        nardoAdvice: 'Nardo!',
        //        nardoAuthorId: props.user!.userId,
        //    })
        //    .returningLastInsertedId()
        //    .executeInsert();

        return {
            success: true,
            row: {
                id: Math.floor(Math.random() * (2500000 - 1000000) + 100000),
                advice: 'Nardo!',
            },
        };
    },

    async list({ pagination, sort }, props) {
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
            .limit(pagination ? pagination.pageSize : 50)
                .offsetIfValue(pagination ? pagination.page * pagination.pageSize : 0)
            .executeSelectPage();

        return {
            success: true,
            rowCount: results.count,
            rows: results.data.map(result =>
                publicView ? { advice: result.advice } :
                             { ...result, date: result.date.toISOString() }),
        }
    },

    async writeLog(request, mutation, props) {
        await Log({
            type: LogType.AdminNardoMutation,
            sourceUser: props.user!.userId,
            data: { mutation },
        });
    },
});

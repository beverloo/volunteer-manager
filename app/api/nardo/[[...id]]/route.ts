// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';
import { executeAction } from '@app/api/Action';

import { deleteAdvice, kDeleteAdviceDefinition } from '../deleteAdvice';
import { updateAdvice, kUpdateAdviceDefinition } from '../updateAdvice';

import { type DataTableEndpoints, createDataTableApi } from '../../createDataTableApi';
import { LogType, Log } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
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
        const kDefaultAdvice = 'Nardo!';

        const dbInstance = db;
        const insertId = await dbInstance.insertInto(tNardo)
            .set({
                nardoAdvice: 'Nardo!',
                nardoAuthorId: props.user!.userId,
                nardoAuthorDate: dbInstance.currentTimestamp(),
            })
            .returningLastInsertedId()
            .executeInsert();

        return {
            success: true,
            row: {
                id: insertId,
                advice: kDefaultAdvice,
                authorName: `${props.user!.firstName} ${props.user!.lastName}`,
                authorUserId: props.user!.userId,
                date: (new Date()).toISOString(),
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
        return;

        await Log({
            type: LogType.AdminNardoMutation,
            sourceUser: props.user!.userId,
            data: { mutation },
        });
    },
});

/**
 * Params accepted by this route implementation. Only the path exists, using NextJS dynamic routing.
 */
type RouteParams = { params: { id: string; } };

/**
 * DELETE /api/nardo/:id
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<Response> {
    if (Object.hasOwn(params, 'id'))
        return executeAction(request, kDeleteAdviceDefinition, deleteAdvice, params);

    return NextResponse.json({ success: false }, { status: 404 });
}


/**
 * PUT /api/nardo/:id
 */
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<Response> {
    if (Object.hasOwn(params, 'id'))
        return executeAction(request, kUpdateAdviceDefinition, updateAdvice, params);

    return NextResponse.json({ success: false }, { status: 404 });
}

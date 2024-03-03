// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../../../createDataTableApi';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tShiftsCategories } from '@lib/database';

/**
 * Row model for a shift category, defining how volunteers can be put into action.
 */
const kEventShiftCategoryRowModel = z.object({
    /**
     * Unique ID of the category as it exists in the database.
     */
    id: z.number(),

    /**
     * Name of the category, as it should be presented to volunteering leads.
     */
    name: z.string(),

    /**
     * Base colour that should be assigned to the category. A palette will be generated.
     */
    colour: z.string(),

    /**
     * Base excitement level for this category. Individual shifts may supersede.
     */
    excitement: z.number(),

    /**
     * Ordering for this category.
     */
    order: z.number(),
});

/**
 * This API has no context requirements.
 */
const kEventShiftCategoryContext = z.never();

/**
 * Export type definitions so that the API can be used in `callApi()`.
 */
export type EventShiftCategoriesEndpoints =
    DataTableEndpoints<typeof kEventShiftCategoryRowModel, typeof kEventShiftCategoryContext>;

/**
 * Export type definition for the API's Row Model.
 */
export type EventShiftCategoriesRowModel = z.infer<typeof kEventShiftCategoryRowModel>;

/**
 * This is implemented as a regular DataTable API. The following endpoints are provided by this
 * implementation:
 *
 *     GET    /api/admin/event/shifts/categories
 *     DELETE /api/admin/event/shifts/categories/:id
 *     POST   /api/admin/event/shifts/categories
 *     PUT    /api/admin/event/shifts/categories/:id
 */
export const { GET, DELETE, POST, PUT } =
createDataTableApi(kEventShiftCategoryRowModel, kEventShiftCategoryContext, {
    async accessCheck(request, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            privilege: Privilege.Administrator,
        });
    },

    async create() {
        const kCategoryName = 'New category';
        const kCategoryColour = '#ff5722';
        const kCategoryExcitement = 0.5;

        const insertId = await db.insertInto(tShiftsCategories)
            .set({
                shiftCategoryName: kCategoryName,
                shiftCategoryColour: kCategoryColour,
                shiftCategoryExcitement: 0.5,
                shiftCategoryOrder: 0,
            })
            .executeInsert();

        return {
            success: true,
            row: {
                id: insertId,
                name: kCategoryName,
                colour: kCategoryColour,
                excitement: kCategoryExcitement,
                order: 0,
            },
        };
    },

    async delete({ id }) {
        return { success: false };
    },

    async list({ sort }) {
        const results = await db.selectFrom(tShiftsCategories)
            .where(tShiftsCategories.shiftCategoryDeleted.isNull())
            .select({
                id: tShiftsCategories.shiftCategoryId,
                name: tShiftsCategories.shiftCategoryName,
                colour: tShiftsCategories.shiftCategoryColour,
                excitement: tShiftsCategories.shiftCategoryExcitement,
                order: tShiftsCategories.shiftCategoryOrder,
            })
            .orderBy(sort?.field ?? 'order', sort?.sort ?? 'asc')
            .executeSelectMany();

        return {
            success: true,
            rowCount: results.length,
            rows: results,
        };
    },

    async update({ row }, props) {
        return { success: false };
    },

    async writeLog({ id }, mutation, props) {
        // TODO
    },
});

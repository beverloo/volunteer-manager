// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../../createDataTableApi';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tEventsSalesConfiguration, tEventsSales } from '@lib/database';
import { kEventSalesCategory } from '@lib/database/Types';

/**
 * Row model for financial sales data associated with a particular event.
 */
const kEventFinanceRowModel = z.object({
    /**
     * Unique ID of the deadline as it exists in the database. Will not be displayed.
     */
    id: z.number(),

    /**
     * Type of sale that this row model details.
     */
    product: z.string(),

    /**
     * Category of sale that this row model details.
     */
    category: z.nativeEnum(kEventSalesCategory).or(z.literal('null')).optional(),

    /**
     * Maximum number of sales that can be supported for this particular category.
     */
    categoryLimit: z.number().optional(),

    /**
     * Optional event ID that this product is associated with.
     */
    eventId: z.number().optional(),
});

/**
 * This API is associated with a particular event.
 */
const kEventFinanceContext = z.object({
    context: z.object({
        /**
         * Unique slug of the event that the deadline is in scope of.
         */
        event: z.string(),
    }),
});

/**
 * Export type definitions so that the API can be used in `callApi()`.
 */
export type EventFinanceEndpoints =
    DataTableEndpoints<typeof kEventFinanceRowModel, typeof kEventFinanceContext>;

/**
 * Export type definition for the API's Row Model.
 */
export type EventFinanceRowModel = z.infer<typeof kEventFinanceRowModel>;

/**
 * This is implemented as a regular DataTable API. The following endpoints are provided by this
 * implementation:
 *
 *     GET    /api/admin/event/finance
 *     PUT    /api/admin/event/finance/:id
 */
export const { GET, DELETE, PUT } =
createDataTableApi(kEventFinanceRowModel, kEventFinanceContext, {
    async accessCheck({ context }, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: context.event,
            permission: {
                permission: 'event.settings',
                scope: {
                    event: context.event,
                },
            },
        });
    },

    async list({ context }) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        const eventsSalesConfigurationJoin = tEventsSalesConfiguration.forUseInLeftJoin();
        const results = await db.selectDistinctFrom(tEventsSales)
            .leftJoin(eventsSalesConfigurationJoin)
                .on(eventsSalesConfigurationJoin.eventId.equals(tEventsSales.eventId))
                .and(eventsSalesConfigurationJoin.eventSaleType.equals(tEventsSales.eventSaleType))
            .where(tEventsSales.eventId.equals(event.id))
            .select({
                product: tEventsSales.eventSaleType,
                category: eventsSalesConfigurationJoin.saleCategory,
                categoryLimit: eventsSalesConfigurationJoin.saleCategoryLimit,
                eventId: eventsSalesConfigurationJoin.saleEventId,
            })
            .groupBy(tEventsSales.eventSaleType)
            .orderBy(tEventsSales.eventSaleType, 'asc')
            .executeSelectMany();

        let id = 0;

        return {
            success: true,
            rowCount: results.length,
            rows: results.map(row => ({
                id: ++id,
                ...row,
            })),
        };
    },

    async update({ context, row }) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        const saleCategory = row.category === 'null' ? null : row.category;

        const affectedRows = await db.insertInto(tEventsSalesConfiguration)
            .set({
                eventId: event.id,
                eventSaleType: row.product,
                saleCategory,
                saleCategoryLimit: row.categoryLimit || null,
                saleEventId: row.eventId || null,
            })
            .onConflictDoUpdateSet({
                saleCategory,
                saleCategoryLimit: row.categoryLimit || null,
                saleEventId: row.eventId || null,
            })
            .executeInsert();

        return { success: !!affectedRows };
    },
});

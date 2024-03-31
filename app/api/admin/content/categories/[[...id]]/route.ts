// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../../createDataTableApi';
import { Log, LogSeverity, LogType } from '@lib/Log';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tContentCategories } from '@lib/database';

/**
 * Row model for a content category.
 */
const kContentCategoryRowModel = z.object({
    /**
     * Unique ID of the category as it exists in the database.
     */
    id: z.number(),

    /**
     * Identifier for the icon that should be used for this category.
     */
    icon: z.string(),

    /**
     * Title of the category.
     */
    title: z.string(),

    /**
     * Description for the category.
     */
    description: z.string().optional(),

    /**
     * Ordering for this category.
     */
    order: z.number(),
});

/**
 * This API is associated with a particular event.
 */
const kContentCategoryContext = z.object({
    context: z.object({
        /**
         * Unique slug of the event that the category is in scope of.
         */
        event: z.string(),
    }),
});

/**
 * Export type definitions so that the API can be used in `callApi()`.
 */
export type ContentCategoriesEndpoints =
    DataTableEndpoints<typeof kContentCategoryRowModel, typeof kContentCategoryContext>;

/**
 * Export type definition for the API's Row Model.
 */
export type ContentCategoriesRowModel = z.infer<typeof kContentCategoryRowModel>;

/**
 * This is implemented as a regular DataTable API. The following endpoints are provided by this
 * implementation:
 *
 *     GET    /api/admin/content/categories
 *     DELETE /api/admin/content/categories/:id
 *     POST   /api/admin/content/categories
 *     PUT    /api/admin/content/categories/:id
 */
export const { GET, DELETE, POST, PUT } =
createDataTableApi(kContentCategoryRowModel, kContentCategoryContext, {
    async accessCheck({ context }, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            event: context.event,
        });
    },

    async create({ context }, props) {
        const event = await getEventBySlug(context.event);
        if (!event || !props.user)
            notFound();

        const kDefaultTitle = 'New category';
        const kDefaultIcon = 'Unknown';
        const kDefaultOrder = 0;

        const dbInstance = db;
        const insertId = await dbInstance.insertInto(tContentCategories)
            .set({
                eventId: event.id,
                categoryTitle: kDefaultTitle,
                categoryIcon: kDefaultIcon,
                categoryOrder: kDefaultOrder,
                categoryCreated: dbInstance.currentZonedDateTime(),
                categoryUpdated: dbInstance.currentZonedDateTime(),
            })
            .executeInsert();

        return {
            success: true,
            row: {
                id: insertId,
                icon: kDefaultIcon,
                title: kDefaultTitle,
                order: kDefaultOrder,
            },
        };
    },

    async delete({ context, id }) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        const dbInstance = db;
        const affectedRows = await dbInstance.update(tContentCategories)
            .set({
                categoryDeleted: dbInstance.currentZonedDateTime(),
            })
            .where(tContentCategories.categoryId.equals(id))
                .and(tContentCategories.eventId.equals(event.id))
                .and(tContentCategories.categoryDeleted.isNull())
            .executeUpdate();

        return { success: !!affectedRows };
    },

    async list({ context, sort }) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        const categories = await db.selectFrom(tContentCategories)
            .where(tContentCategories.eventId.equals(event.id))
                .and(tContentCategories.categoryDeleted.isNull())
            .select({
                id: tContentCategories.categoryId,
                icon: tContentCategories.categoryIcon,
                title: tContentCategories.categoryTitle,
                description: tContentCategories.categoryDescription,
                order: tContentCategories.categoryOrder,
            })
            .orderBy(sort?.field ?? 'title', sort?.sort ?? 'asc')
            .executeSelectPage();

        return {
            success: true,
            rowCount: categories.count,
            rows: categories.data,
        };
    },

    async reorder({ context, order }) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        console.log(order);

        const dbInstance = db;
        await dbInstance.transaction(async () => {
            for (let index = 0; index < order.length; ++index) {
                await db.update(tContentCategories)
                    .set({ categoryOrder: index })
                    .where(tContentCategories.categoryId.equals(order[index]))
                    .executeUpdate();
            }
        });

        return { success: true };
    },

    async update({ context, row }) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        const dbInstance = db;
        const affectedRows = await dbInstance.update(tContentCategories)
            .set({
                categoryTitle: row.title,
                categoryIcon: row.icon,
                categoryDescription: !!row.description ? row.description : null,
                categoryUpdated: dbInstance.currentZonedDateTime(),
            })
            .where(tContentCategories.categoryId.equals(row.id))
                .and(tContentCategories.eventId.equals(event.id))
                .and(tContentCategories.categoryDeleted.isNull())
            .executeUpdate();

        return { success: !!affectedRows };
    },

    async writeLog({ context, id }, mutation, props) {
        const event = await getEventBySlug(context.event);
        if (!event || mutation === 'Reordered')
            return;

        const category = await db.selectFrom(tContentCategories)
            .where(tContentCategories.eventId.equals(event.id))
                .and(tContentCategories.categoryId.equals(id))
            .selectOneColumn(tContentCategories.categoryTitle)
            .executeSelectNoneOrOne();

        return;

        await Log({
            type: LogType.AdminKnowledgeBaseCategoryMutation,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            data: {
                event: event!.shortName,
                category,
                mutation,
            },
        });
    },
});

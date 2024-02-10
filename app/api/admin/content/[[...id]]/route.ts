// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../createDataTableApi';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { Temporal } from '@lib/Temporal';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventSlugForId } from '@lib/EventLoader';

import db, { tContent, tEvents, tTeams, tUsers } from '@lib/database';

/**
 * Row model for a piece of content, as can be shown or edited through the administration panel.
 */
const kContentRowModel = z.object({
    /**
     * Unique ID of the content as it exists in the database.
     */
    id: z.number(),

    /**
     * The content, using Markdown, contained on the page.
     */
    content: z.string().optional(),

    /**
     * Path of the content, excluding any prefixes (e.g. "privacy").
     */
    path: z.string().regex(/^[/.a-zA-Z0-9-]*$/),

    /**
     * Title of the content.
     */
    title: z.string().min(1),

    /**
     * Date and time (in UTC) at which the content was last updated.
     */
    updatedOn: z.string(),

    /**
     * Full name of the volunteer who last updated the content.
     */
    updatedBy: z.string(),

    /**
     * User ID of the volunteer who last updated the content.
     */
    updatedByUserId: z.number(),

    /**
     * Included when the content has been protected and cannot be removed.
     */
    protected: z.boolean(),
});

/**
 * Context required by the Content API. This is considered the content's "scope".
 */
const kContentContext = z.object({
    context: z.object({
        /**
         * Unique ID of the event content will be scoped to.
         */
        eventId: z.coerce.number(),

        /**
         * Unique ID of the team content will be scoped to.
         */
        teamId: z.coerce.number(),
    }),
});

/**
 * Export type definitions so that the Content DataTable API can be used in `callApi()`.
 */
export type ContentEndpoints = DataTableEndpoints<typeof kContentRowModel, typeof kContentContext>;

/**
 * Export type definition for the Content DataTable API's Row Model.
 */
export type ContentRowModel = z.infer<typeof kContentRowModel>;

/**
 * Scope expected by the Content API.
 */
export type ContentScope = z.infer<typeof kContentContext>['context'];

/**
 * The Content API is implemented as a regular, editable DataTable API. All operations are gated on
 * privileges specific to the content's context, and changes will be logged as appropriate.
 *
 * The following endpoints are provided by this implementation:
 *
 *     DELETE /api/admin/content/:id
 *     GET /api/admin/content
 *     GET /api/admin/content/:id
 *     POST /api/admin/content
 *     PUT /api/admin/content/:id
 */
export const { DELETE, POST, PUT, GET } = createDataTableApi(kContentRowModel, kContentContext, {
    async accessCheck({ context }, action, props) {
        if (context.eventId === /* invalid event= */ 0) {
            executeAccessCheck(props.authenticationContext, {
                check: 'admin',
                privilege: Privilege.SystemContentAccess,
            });
        } else {
            executeAccessCheck(props.authenticationContext, {
                check: 'admin-event',
                event: (await getEventSlugForId(context.eventId))!,
            })
        }
    },

    async create({ context, row }, props) {
        if (!row.path || !row.title)
            return { success: false, error: 'The content title and path must be included' };

        const existingContent = await db.selectFrom(tContent)
            .where(tContent.eventId.equals(context.eventId))
                .and(tContent.teamId.equals(context.teamId))
                .and(tContent.contentPath.equals(row.path))
                .and(tContent.revisionVisible.equals(/* true= */ 1))
            .selectCountAll()
            .executeSelectOne();

        if (!!existingContent)
            return { success: false, error: 'There already exists a page with that path' };

        const dbInstance = db;
        const insertId = await dbInstance.insertInto(tContent)
            .set({
                eventId: context.eventId,
                teamId: context.teamId,
                contentPath: row.path,
                contentTitle: row.title,
                contentProtected: /* unprotected= */ 0,
                content: '',
                revisionAuthorId: props.user!.userId,
                revisionDate: dbInstance.currentTimestamp(),
                revisionVisible: /* true= */ 1,
            })
            .returningLastInsertedId()
            .executeInsert();

        return {
            success: true,
            row: {
                id: insertId,
                path: row.path,
                title: row.title,
                updatedOn: Temporal.Now.zonedDateTimeISO('UTC').toString(),
                updatedBy: `${props.user!.firstName} ${props.user!.lastName}`,
                updatedByUserId: props.user!.userId,
                protected: false,
            },
        }
    },

    async delete({ context, id }) {
        const affectedRows = await db.update(tContent)
            .set({ revisionVisible: /* false= */ 0 })
            .where(tContent.contentId.equals(id))
                .and(tContent.eventId.equals(context.eventId))
                .and(tContent.teamId.equals(context.teamId))
                .and(tContent.contentProtected.equals(/* false= */ 0))
            .executeUpdate(/* min= */ 0, /* max= */ 1);

        return { success: !!affectedRows };
    },

    async get({ context, id }) {
        const dbInstance = db;
        const row = await dbInstance.selectFrom(tContent)
            .innerJoin(tUsers)
                .on(tUsers.userId.equals(tContent.revisionAuthorId))
            .where(tContent.contentId.equals(id))
                .and(tContent.eventId.equals(context.eventId))
                .and(tContent.teamId.equals(context.teamId))
            .select({
                id: tContent.contentId,
                content: tContent.content,
                path: tContent.contentPath,
                title: tContent.contentTitle,
                updatedOn: tContent.revisionDateString,
                updatedBy: tUsers.firstName.concat(' ').concat(tUsers.lastName),
                updatedByUserId: tUsers.userId,
                protected: tContent.contentProtected.equals(/* true= */ 1),
            })
            .executeSelectNoneOrOne();

        if (!row)
            return { success: false, error: 'This item could not be retrieved from the database.' };

        return { success: true, row };
    },

    async list({ context, pagination, sort }) {
        if (sort?.field === 'content')
            return { success: false, error: 'Unable to sort based on Markdown content' };

        const dbInstance = db;

        const { count, data } = await dbInstance.selectFrom(tContent)
            .innerJoin(tUsers)
                .on(tUsers.userId.equals(tContent.revisionAuthorId))
            .where(tContent.eventId.equals(context.eventId))
                .and(tContent.teamId.equals(context.teamId))
                .and(tContent.revisionVisible.equals(/* true= */ 1))
            .select({
                id: tContent.contentId,
                path: tContent.contentPath,
                title: tContent.contentTitle,
                updatedOn: tContent.revisionDateString,
                updatedBy: tUsers.firstName.concat(' ').concat(tUsers.lastName),
                updatedByUserId: tUsers.userId,
                protected: tContent.contentProtected.equals(/* true= */ 1),
            })
            .orderBy(sort?.field ?? 'path', sort?.sort ?? 'asc')
            .limitIfValue(pagination ? pagination.pageSize : null)
                .offsetIfValue(pagination ? pagination.page * pagination.pageSize : null)
            .executeSelectPage();

        return {
            success: true,
            rowCount: count,
            rows: data,
        }
    },

    async update({ context, id, row }, props) {
        // (1) Fetch whether the existing content is protected, in which case we do not allow the
        //     path to be updated. Failing to do that check could break the system.
        const existingContent = await db.selectFrom(tContent)
            .where(tContent.contentId.equals(id))
                .and(tContent.eventId.equals(context.eventId))
                .and(tContent.teamId.equals(context.teamId))
            .select({
                path: tContent.contentPath,
                protected: tContent.contentProtected.equals(/* true= */ 1)
            })
            .executeSelectNoneOrOne();

        if (!existingContent)
            return { success: false, error: 'The content you are editing could not be found' };

        if (existingContent.path !== row.path) {
            if (existingContent.protected)
                return { success: false, error: 'You cannot change the path of protected content' };

            // (2) Determine whether there exists any duplicated content, which means multiple
            //     pieces of content within the same scope that share the same path.
            const duplicatedContent = await db.selectFrom(tContent)
                .where(tContent.eventId.equals(context.eventId))
                    .and(tContent.teamId.equals(context.teamId))
                    .and(tContent.contentPath.equals(row.path))
                    .and(tContent.revisionVisible.equals(/* true= */ 1))
                .select({ id: tContent.contentId })
                .executeSelectNoneOrOne();

            if (duplicatedContent && duplicatedContent.id !== id)
                return { success: false, error: 'There already exists a page with that path' }
        }

        // (3) Actually update the content now that we know this can be safely done so.
        const affectedRows = await db.update(tContent)
            .set({
                contentPath: row.path,
                contentTitle: row.title,
                content: row.content,
                revisionAuthorId: props.user!.userId,
                revisionDate: db.currentTimestamp(),
            })
            .where(tContent.contentId.equals(id))
                .and(tContent.eventId.equals(context.eventId))
                .and(tContent.teamId.equals(context.teamId))
            .executeUpdate();

        return { success: !!affectedRows };
    },

    async writeLog({ id }, mutation, props) {
        const eventsJoin = tEvents.forUseInLeftJoin();
        const teamsJoin = tTeams.forUseInLeftJoin();

        const contentContext = await db.selectFrom(tContent)
            .leftJoin(eventsJoin)
                .on(eventsJoin.eventId.equals(tContent.eventId))
            .leftJoin(teamsJoin)
                .on(teamsJoin.teamId.equals(tContent.teamId))
            .where(tContent.contentId.equals(id))
            .select({
                eventName: eventsJoin.eventShortName,
                teamName: teamsJoin.teamName,
                contentTitle: tContent.contentTitle,
            })
            .executeSelectNoneOrOne();

        let resolvedContext = `with unknown context (id: ${id})`;
        if (contentContext) {
            if (!!contentContext.eventName) {
                resolvedContext =
                    `"${contentContext.contentTitle}" for ${contentContext.eventName} ` +
                    `(${contentContext.teamName})`;
            } else {
                resolvedContext = `"${contentContext.contentTitle}" from global content`;
            }
        }

        await Log({
            type: LogType.AdminContentMutation,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            data: {
                context: resolvedContext,
                mutation,
            },
        });
    },
});

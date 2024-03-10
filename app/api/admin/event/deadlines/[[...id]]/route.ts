// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../../createDataTableApi';
import { Log, LogSeverity, LogType } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { Temporal } from '@lib/Temporal';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tEventsDeadlines, tUsers } from '@lib/database';

/**
 * Row model for a deadline associated with a particular event.
 */
const kEventDeadlineRowModel = z.object({
    /**
     * Unique ID of the deadline as it exists in the database.
     */
    id: z.number(),

    /**
     * Date on which the deadline will expire.
     */
    date: z.string().regex(/^\d{4}\-\d{2}\-\d{2}$/),

    /**
     * Title of the deadline, giving a succint description of what it's about.
     */
    title: z.string(),

    /**
     * Description explaining what this deadline is about.
     */
    description: z.string(),

    /**
     * User ID of the person responsible for deliving on this deadline.
     */
    ownerUserId: z.number().optional(),

    /**
     * Whether the deadline has been completed.
     */
    completed: z.boolean(),
});

/**
 * This API is associated with a particular event.
 */
const kEventDeadlineContext = z.object({
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
export type EventDeadlinesEndpoints =
    DataTableEndpoints<typeof kEventDeadlineRowModel, typeof kEventDeadlineContext>;

/**
 * Export type definition for the API's Row Model.
 */
export type EventDeadlinesRowModel = z.infer<typeof kEventDeadlineRowModel>;

/**
 * This is implemented as a regular DataTable API. The following endpoints are provided by this
 * implementation:
 *
 *     GET    /api/admin/event/deadlines
 *     DELETE /api/admin/event/deadlines/:id
 *     POST   /api/admin/event/deadlines
 *     PUT    /api/admin/event/deadlines/:id
 */
export const { GET, DELETE, POST, PUT } =
createDataTableApi(kEventDeadlineRowModel, kEventDeadlineContext, {
    async accessCheck(request, action, props) {
        executeAccessCheck(props.authenticationContext, {
            check: 'admin-event',
            privilege: Privilege.EventAdministrator,
        });
    },

    async create({ context }, props) {
        const event = await getEventBySlug(context.event);
        if (!event || !props.user)
            notFound();

        const deadlineDate = event.temporalStartTime.toPlainDate();

        const kDeadlineTitle = 'New deadline';
        const kDeadlineDescription = 'Brief description of what is expected, by who.';

        const insertId = await db.insertInto(tEventsDeadlines)
            .set({
                eventId: event.id,
                deadlineOwnerId: props.user.userId,
                deadlineDate: deadlineDate,
                deadlineTitle: kDeadlineTitle,
                deadlineDescription: kDeadlineDescription,
                deadlineCompleted: null,
                deadlineDeleted: null,
            })
            .returningLastInsertedId()
            .executeInsert();

        return {
            success: true,
            row: {
                id: insertId,
                date: deadlineDate.toString(),
                title: kDeadlineTitle,
                description: kDeadlineDescription,
                ownerUserId: props.user.userId,
                completed: false,
            },
        };
    },

    async delete({ context, id }) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        const dbInstance = db;
        const affectedRows = await dbInstance.update(tEventsDeadlines)
            .set({
                deadlineDeleted: dbInstance.currentZonedDateTime(),
            })
            .where(tEventsDeadlines.deadlineId.equals(id))
                .and(tEventsDeadlines.eventId.equals(event.id))
                .and(tEventsDeadlines.deadlineDeleted.isNull())
            .executeUpdate();

        return { success: !!affectedRows };
    },

    async list({ context, sort }) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        const usersJoin = tUsers.forUseInLeftJoin();

        const deadlines = await db.selectFrom(tEventsDeadlines)
            .leftJoin(usersJoin)
                .on(usersJoin.userId.equals(tEventsDeadlines.deadlineOwnerId))
            .select({
                id: tEventsDeadlines.deadlineId,
                date: tEventsDeadlines.deadlineDateString,
                title: tEventsDeadlines.deadlineTitle,
                description: tEventsDeadlines.deadlineDescription,
                ownerUserId: usersJoin.userId,
                completed: tEventsDeadlines.deadlineCompleted.isNotNull(),
            })
            .where(tEventsDeadlines.eventId.equals(event.id))
                .and(tEventsDeadlines.deadlineDeleted.isNull())
            .orderBy(sort?.field ?? 'date', sort?.sort ?? 'asc')
            .executeSelectPage();

        return {
            success: true,
            rowCount: deadlines.count,
            rows: deadlines.data,
        };
    },

    async update({ context, row }) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        const dbInstance = db;
        const affectedRows = await dbInstance.update(tEventsDeadlines)
            .set({
                deadlineDate: Temporal.PlainDate.from(row.date),
                deadlineOwnerId: row.ownerUserId,
                deadlineTitle: row.title,
                deadlineDescription: row.description,
                deadlineCompleted: row.completed ? dbInstance.currentZonedDateTime() : null,
            })
            .where(tEventsDeadlines.deadlineId.equals(row.id))
                .and(tEventsDeadlines.eventId.equals(event.id))
                .and(tEventsDeadlines.deadlineDeleted.isNull())
            .executeUpdate();

        return { success: !!affectedRows };
    },

    async writeLog({ context }, mutation, props) {
        const event = await getEventBySlug(context.event);
        await Log({
            type: LogType.AdminEventDeadlineMutation,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            data: {
                event: event!.shortName,
                mutation,
            },
        });
    },
});

// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import { type DataTableEndpoints, createDataTableApi } from '../../../../createDataTableApi';
import { ContentType } from '@lib/database/Types';
import { Log, LogSeverity, kLogType } from '@lib/Log';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { getEventBySlug } from '@lib/EventLoader';
import db, { tContent, tEventsTeams, tTeams } from '@lib/database';

/**
 * Row model for a team's participation. Configuration is mutable, but cannot be created or removed.
 */
const kEventTeamRowModel = z.object({
    /**
     * Unique ID of the team as it exists in the database.
     */
    id: z.number(),

    /**
     * Name of the team that these settings are for.
     */
    name: z.string(),

    /**
     * The ideal number of volunteers that we'll recruit into this team.
     */
    targetSize: z.number().optional(),

    /**
     * Maximum number of volunteers that can be recruited.
     */
    maximumSize: z.number().optional(),

    /**
     * Whether this team participates in this event at all.
     */
    enableTeam: z.boolean().optional(),

    /**
     * Link that can be shared with accepted volunteers in this team to join the WhatsApp group.
     */
    whatsappLink: z.string().optional(),

});

/**
 * This API does not require any context.
 */
const kEventTeamContext = z.object({
    context: z.object({
        /**
         * Unique slug of the event that the request is in scope of.
         */
        event: z.string(),
    }),
});

/**
 * Export type definitions so that the API can be used in `callApi()`.
 */
export type EventTeamEndpoints =
    DataTableEndpoints<typeof kEventTeamRowModel, typeof kEventTeamContext>;

/**
 * Export type definition for the API's Row Model.
 */
export type EventTeamRowModel = z.infer<typeof kEventTeamRowModel>;

/**
 * Export type definition for the API's context.
 */
export type EventTeamContext = z.infer<typeof kEventTeamContext>;

/**
 * This is implemented as a regular DataTable API. The following endpoints are provided by this
 * implementation:
 *
 *     GET /api/admin/event/teams
 *     PUT /api/admin/event/teams/:id
 */
export const { GET, PUT } = createDataTableApi(kEventTeamRowModel, kEventTeamContext, {
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

        const eventsTeamsJoin = tEventsTeams.forUseInLeftJoin();

        const teams = await db.selectFrom(tTeams)
            .leftJoin(eventsTeamsJoin)
                .on(eventsTeamsJoin.eventId.equals(event.id))
                .and(eventsTeamsJoin.teamId.equals(tTeams.teamId))
            .select({
                id: tTeams.teamId,
                name: tTeams.teamName,
                targetSize: eventsTeamsJoin.teamTargetSize,
                maximumSize: eventsTeamsJoin.teamMaximumSize,
                enableTeam: eventsTeamsJoin.enableTeam.equals(/* true= */ 1),
                whatsappLink: eventsTeamsJoin.whatsappLink,
            })
            .orderBy(tTeams.teamName, 'asc')
            .executeSelectMany();

        return {
            success: true,
            rowCount: teams.length,
            rows: teams,
        };
    },

    async update({ context, row }, props) {
        const event = await getEventBySlug(context.event);
        if (!event)
            notFound();

        const dbInstance = db;
        const success = await dbInstance.transaction(async () => {
            if (!row)
                return false;  // microtasks, you know...

            const affectedRows = await dbInstance.insertInto(tEventsTeams)
                .set({
                    eventId: event.eventId,
                    teamId: row.id,
                    teamTargetSize: row.targetSize ?? 25,
                    teamMaximumSize: row.maximumSize ?? 0,
                    enableTeam: row.enableTeam ? 1 : 0,
                    whatsappLink: row.whatsappLink,
                })
                .onConflictDoUpdateSet({
                    teamTargetSize: row.targetSize || undefined,
                    teamMaximumSize: row.maximumSize || undefined,
                    enableTeam: row.enableTeam ? 1 : 0,
                    whatsappLink: row.whatsappLink,
                })
                .executeInsert();

            if (!!affectedRows && row.enableTeam) {
                const pages = [
                    { contentPath: '', contentTitle: event.shortName },
                    { contentPath: 'application', contentTitle: 'Apply to join' },
                ];

                await dbInstance.insertInto(tContent)
                    .values(pages.map((pageProps) => ({
                        eventId: event.eventId,
                        teamId: row!.id,
                        contentType: ContentType.Page,
                        content: 'No content has been written yet…',
                        contentProtected: 1,
                        revisionAuthorId: props.user!.userId,
                        revisionVisible: 1,
                        ...pageProps,
                    })))
                    .onConflictDoNothing()
                    .executeInsert();
            }

            return !!affectedRows;
        });

        return { success };
    },

    async writeLog({ context, id }, mutation, props) {
        const event = await getEventBySlug(context.event);
        if (!event)
            return;

        const teamName = await db.selectFrom(tTeams)
            .where(tTeams.teamId.equals(id))
            .selectOneColumn(tTeams.teamName)
            .executeSelectNoneOrOne();

        await Log({
            type: kLogType.AdminUpdateEvent,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            data: {
                action: 'team settings',
                event: event.shortName,
                team: teamName,
            }
        });
    },
});

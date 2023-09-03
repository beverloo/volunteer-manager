// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../../Action';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { confirmUserHasAccess, kContentScopeDefinition } from './listContent';
import db, { tContent, tEvents, tTeams } from '@lib/database';

/**
 * Returns context for the content identified by `contentId`. The context will be written to the
 * log to identify exactly what content was mutated.
 *
 * @use "Deleted page " ...
 * @use "Updated page " ...
 */
export async function contextForContent(contentId: number): Promise<string> {
    const eventsJoin = tEvents.forUseInLeftJoin();
    const teamsJoin = tTeams.forUseInLeftJoin();

    const context = await db.selectFrom(tContent)
        .leftJoin(eventsJoin)
            .on(eventsJoin.eventId.equals(tContent.eventId))
        .leftJoin(teamsJoin)
            .on(teamsJoin.teamId.equals(tContent.teamId))
        .where(tContent.contentId.equals(contentId))
        .select({
            eventName: eventsJoin.eventShortName,
            teamName: teamsJoin.teamName,
            contentTitle: tContent.contentTitle,
        })
        .executeSelectNoneOrOne();

    if (!context)
        return `with unknown context (id: ${contentId})`;

    if (!!context.eventName)
        return `"${context.contentTitle}" for ${context.eventName} (${context.teamName})`;
    else
        return `"${context.contentTitle}" from global content`;
}

/**
 * Interface definition for the Content API, exposed through /api/admin/content.
 */
export const kDeleteContentDefinition = z.object({
    request: z.object({
        /**
         * Unique ID of the content that is to be deleted. Conveyed in the URL.
         */
        id: z.coerce.number(),

        /**
         * Scope of content which should be considered by this API.
         */
        scope: kContentScopeDefinition,
    }),
    response: z.strictObject({
        /**
         * Whether the content was successfully deleted.
         */
        success: z.boolean(),
    }),
});

export type DeleteContentDefinition = z.infer<typeof kDeleteContentDefinition>;

type Request = DeleteContentDefinition['request'];
type Response = DeleteContentDefinition['response'];

/**
 * API to delete a certain piece of content. The content must not be protected.
 */
export async function deleteContent(request: Request, props: ActionProps): Promise<Response> {
    if (!await confirmUserHasAccess(request.scope, props.user))
        noAccess();

    const affectedRows = await db.update(tContent)
        .set({ revisionVisible: /* false= */ 0 })
        .where(tContent.contentId.equals(request.id))
            .and(tContent.eventId.equals(request.scope.eventId))
            .and(tContent.teamId.equals(request.scope.teamId))
            .and(tContent.contentProtected.equals(/* false= */ 0))
        .executeUpdate(/* min= */ 0, /* max= */ 1);

    if (affectedRows > 0) {
        await Log({
            type: LogType.AdminContentMutation,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            data: {
                context: await contextForContent(request.id),
                mutation: 'Deleted',
            },
        });
    }

    return { success: !!affectedRows };
}

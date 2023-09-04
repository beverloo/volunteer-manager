// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../../Action';
import { LogSeverity, LogType, Log } from '@lib/Log';
import { confirmUserHasAccess, kContentScopeDefinition } from './listContent';
import { contextForContent } from './deleteContent';
import db, { tContent } from '@lib/database';

/**
 * Interface definition for the Content API, exposed through /api/admin/content.
 */
export const kUpdateContentDefinition = z.object({
    request: z.object({
        /**
         * Unique ID of the content that is to be updated. Conveyed in the URL.
         */
        id: z.coerce.number(),

        /**
         * Scope of content which should be considered by this API.
         */
        scope: kContentScopeDefinition,

        /**
         * The content, using Markdown, contained on the page.
         */
        content: z.string(),

        /**
         * Path of the content, excluding any prefixes (e.g. "privacy").
         */
        path: z.string().regex(/^[/.a-zA-Z0-9-]+$/),

        /**
         * Title of the content.
         */
        title: z.string().nonempty(),
    }),
    response: z.strictObject({
        /**
         * Whether the content could be updated successfully.
         */
        success: z.boolean(),

        /**
         * Error message, only included when an error has occurred.
         */
        error: z.string().optional(),
    }),
});

export type UpdateContentDefinition = z.infer<typeof kUpdateContentDefinition>;

type Request = UpdateContentDefinition['request'];
type Response = UpdateContentDefinition['response'];

/**
 * API to update content that exists at a specific scope.
 */
export async function updateContent(request: Request, props: ActionProps): Promise<Response> {
    if (!await confirmUserHasAccess(request.scope, props.user))
        noAccess();

    // (1) Fetch whether the existing content is protected, in which case we do not allow the path
    //     to be updated. Failing to do that check could break the system.
    const existingContent = await db.selectFrom(tContent)
        .where(tContent.contentId.equals(request.id))
            .and(tContent.eventId.equals(request.scope.eventId))
            .and(tContent.teamId.equals(request.scope.teamId))
        .select({
            path: tContent.contentPath,
            protected: tContent.contentProtected.equals(/* true= */ 1)
        })
        .executeSelectNoneOrOne();

    if (!existingContent)
        return { success: false, error: 'The content you are editing could not be found' };

    if (existingContent.path !== request.path) {
        if (existingContent.protected)
            return { success: false, error: 'You cannot change the path of protected content' };

        // (2) Determine whether there exists any duplicated content, which means multiple pieces of
        //     content within the same scope that share the same path.
        const duplicatedContent = await db.selectFrom(tContent)
            .where(tContent.eventId.equals(request.scope.eventId))
                .and(tContent.teamId.equals(request.scope.teamId))
                .and(tContent.contentPath.equals(request.path))
                .and(tContent.revisionVisible.equals(/* true= */ 1))
            .select({ id: tContent.contentId })
            .executeSelectNoneOrOne();

        if (duplicatedContent && duplicatedContent.id !== request.id)
            return { success: false, error: 'There already exists a page with that path' }
    }

    // (3) Actually update the content now that we know this can be safely done so.
    const affectedRows = await db.update(tContent)
        .set({
            contentPath: request.path,
            contentTitle: request.title,
            content: request.content,
        })
        .where(tContent.contentId.equals(request.id))
            .and(tContent.eventId.equals(request.scope.eventId))
            .and(tContent.teamId.equals(request.scope.teamId))
        .executeUpdate(/* min= */ 0, /* max= */ 1);

    if (affectedRows > 0) {
        await Log({
            type: LogType.AdminContentMutation,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            data: {
                context: await contextForContent(request.id),
                mutation: 'Updated',
            },
        });
    }

    return { success: !!affectedRows };
}

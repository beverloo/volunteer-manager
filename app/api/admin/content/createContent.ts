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
export const kCreateContentDefinition = z.object({
    request: z.object({
        /**
         * Scope of content which should be considered by this API.
         */
        scope: kContentScopeDefinition,

        /**
         * Path of the content, using which it should be identified.
         */
        path: z.string().regex(/^[/.a-zA-Z0-9-]+$/),

        /**
         * Title of the content, as it should be created in the database.
         */
        title: z.string(),

    }),
    response: z.strictObject({
        /**
         * Error message when the content could not be created.
         */
        error: z.string().optional(),

        /**
         * Unique ID of the content when it was created successfully.
         */
        id: z.number().optional(),
    }),
});

export type CreateContentDefinition = z.infer<typeof kCreateContentDefinition>;

type Request = CreateContentDefinition['request'];
type Response = CreateContentDefinition['response'];

/**
 * API to create new content within a given scope.
 */
export async function createContent(request: Request, props: ActionProps): Promise<Response> {
    if (!await confirmUserHasAccess(request.scope, props.user))
        noAccess();

    const existingContent = await db.selectFrom(tContent)
        .where(tContent.eventId.equals(request.scope.eventId))
            .and(tContent.teamId.equals(request.scope.teamId))
            .and(tContent.contentPath.equals(request.path))
            .and(tContent.revisionVisible.equals(/* true= */ 1))
        .selectCountAll()
        .executeSelectOne();

    if (!!existingContent)
        return { error: 'There already exists a page with that path' };

    const dbInstance = db;
    const insertId = await dbInstance.insertInto(tContent)
        .set({
            eventId: request.scope.eventId,
            teamId: request.scope.teamId,
            contentPath: request.path,
            contentTitle: request.title,
            contentProtected: /* unprotected= */ 0,
            content: '',
            revisionAuthorId: props.user!.userId,
            revisionDate: dbInstance.currentTimestamp(),
            revisionVisible: /* true= */ 1,
        })
        .returningLastInsertedId()
        .executeInsert();

    if (!!insertId) {
        await Log({
            type: LogType.AdminContentMutation,
            severity: LogSeverity.Warning,
            sourceUser: props.user,
            data: {
                context: await contextForContent(insertId),
                mutation: 'Created',
            },
        });
    }

    return !!insertId ? { id: insertId }
                      : { error: 'Could not create the page in the database' };
}

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../../Action';
import { confirmUserHasAccess, kContentScopeDefinition } from './listContent';
import db, { tContent } from '@lib/database';

/**
 * Interface definition for the Content API, exposed through /api/admin/content.
 */
export const kGetContentDefinition = z.object({
    request: z.object({
        /**
         * Unique ID of the content that is to be retrieved. Conveyed in the URL.
         */
        id: z.coerce.number(),

        /**
         * Scope of content which should be considered by this API.
         */
        scope: kContentScopeDefinition,
    }),
    response: z.strictObject({
        /**
         * The content, using Markdown, contained on the page.
         */
        content: z.string().optional(),

        /**
         * Path of the content, excluding any prefixes (e.g. "privacy").
         */
        path: z.string().optional(),

        /**
         * Title of the content.
         */
        title: z.string().optional(),

        /**
         * Whether the content is protected. Paths cannot be edited in that case.
         */
        protected: z.boolean().optional(),
    }),
});

export type GetContentDefinition = z.infer<typeof kGetContentDefinition>;

type Request = GetContentDefinition['request'];
type Response = GetContentDefinition['response'];

/**
 * API to get a piece of content within a particular scope.
 */
export async function getContent(request: Request, props: ActionProps): Promise<Response> {
    confirmUserHasAccess(request.scope, props.authenticationContext);

    return await db.selectFrom(tContent)
        .where(tContent.contentId.equals(request.id))
            .and(tContent.eventId.equals(request.scope.eventId))
            .and(tContent.teamId.equals(request.scope.teamId))
        .select({
            path: tContent.contentPath,
            title: tContent.contentTitle,
            content: tContent.content,
            protected: tContent.contentProtected.equals(/* true= */ 1),
        })
        .executeSelectNoneOrOne() ?? { /* error condition */ };
}

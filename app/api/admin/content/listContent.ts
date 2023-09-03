// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ContentScope } from '@app/admin/content/ContentScope';
import type { User } from '@app/lib/auth/User';
import { type ActionProps, noAccess } from '../../Action';
import { Privilege, can } from '@lib/auth/Privileges';
import db, { tContent, tUsers } from '@lib/database';

/**
 * Definition of the scope at which content is being considered. Corresponds to the ContentScope
 * type that exists in the `//app/admin/content/ContentScope.ts` file.
 */
export const kContentScopeDefinition = z.object({
    /**
     * Unique ID of the event content will be scoped to.
     */
    eventId: z.coerce.number(),

    /**
     * Unique ID of the team content will be scoped to.
     */
    teamId: z.coerce.number(),
});

/**
 * Confirm whether the given `user` has access to content of the given `scope`. The check for global
 * content is synchronous, whereas event-based content may be checked in the database
 */
export async function confirmUserHasAccess(scope: ContentScope, user?: User): Promise<boolean> {
    if (scope.eventId === /* invalid event= */ 0)
        return can(user, Privilege.SystemContentAccess);

    if (can(user, Privilege.EventAdministrator))
        return true;  // event administrators can always access event content

    // TODO: Allow Senior+ volunteers with implied access to modify content as well.
    return false;
}

/**
 * Interface definition for the Content API, exposed through /api/admin/content.
 */
export const kListContentDefinition = z.object({
    request: z.object({
        /**
         * Scope of content which should be considered by this API.
         */
        scope: kContentScopeDefinition,

        /**
         * Sort that should be applied to the content list. Optional.
         */
        sort: z.object({
            /**
             * Fields that this API is able to sort content by.
             */
            field: z.enum([ 'path', 'title', 'updatedOn', 'updatedBy' ]),

            /**
             * Directions that this API is able to sort content by.
             */
            sort: z.enum([ 'asc', 'desc' ]).nullable().optional(),

        }).optional(),
    }),
    response: z.strictObject({
        /**
         * The content that exists at this scope.
         */
        content: z.array(z.strictObject({
            /**
             * Unique ID of the content as it exists in the database.
             */
            id: z.number(),

            /**
             * Path of the content, excluding any prefixes (e.g. "privacy").
             */
            path: z.string(),

            /**
             * Title of the content.
             */
            title: z.string(),

            /**
             * Date (in seconds since the UNIX epoch) at which the content was last updated.
             */
            updatedOn: z.number(),

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
        })),
    }),
});

export type ListContentDefinition = z.infer<typeof kListContentDefinition>;

type Request = ListContentDefinition['request'];
type Response = ListContentDefinition['response'];

/**
 * API to list the content that exists within a specific scope.
 */
export async function listContent(request: Request, props: ActionProps): Promise<Response> {
    if (!await confirmUserHasAccess(request.scope, props.user))
        noAccess();

    const content = await db.selectFrom(tContent)
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tContent.revisionAuthorId))
        .where(tContent.eventId.equals(request.scope.eventId))
            .and(tContent.teamId.equals(request.scope.teamId))
            .and(tContent.revisionVisible.equals(/* true= */ 1))
        .select({
            id: tContent.contentId,
            path: tContent.contentPath,
            title: tContent.contentTitle,
            updatedOn: tContent.revisionDate.getTime().divide(/* ms => s */ 1000),
            updatedBy: tUsers.firstName.concat(' ').concat(tUsers.lastName),
            updatedByUserId: tUsers.userId,
            protected: tContent.contentProtected.equals(/* true= */ 1),
        })
        .orderBy(request.sort?.field ?? 'path', request.sort?.sort ?? 'asc')
        .executeSelectMany();

    return { content };
}

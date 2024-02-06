// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Event } from './Event';
import db, { tContent, tTeams } from './database';

/**
 * Interface defining the information that will be made available for a particular piece of content
 * that can be shown on the volunteer manager.
 */
export interface Content {
    /**
     * Title of the page as it should be displayed. No length limits.
     */
    title: string;

    /**
     * Content of the page, formatted in Markdown. No length limits, but should be displayed using
     * the <Markdown> element to ensure proper display.
     */
    markdown: string;
}

/**
 * Content substitutions that can be provided to the `getContent` functions.
 */
type ContentSubstitutions = Record<string, string>;

/**
 * Fetches content from the database for the given `path`, `event` and `environmentName` tuple. Will
 * run a database query to do so. Only the latest revision of a page will be included, all else will
 * be ignored as they are no longer deemed relevant.
 *
 * @param environmentName The environment for which to fetch the content.
 * @param event The event with which the content should be associated.
 * @param path The path towards the content, relative from the /registration/slug/ root.
 * @param substitutions Content substitutions that should be applied, if any.
 * @return Content object with the content when found, or undefined in all other cases.
 */
export async function getContent(
    environmentName: string, event: Event, path: string[], substitutions?: ContentSubstitutions)
        : Promise<Content | undefined>
{
    const teamsJoin = tTeams.forUseInLeftJoin();

    const content = await db.selectFrom(tContent)
        .leftJoin(teamsJoin)
            .on(teamsJoin.teamId.equals(tContent.teamId))
        .where(tContent.eventId.equals(event.eventId))
            .and(tContent.contentPath.equals(path.join('/')))
            .and(tContent.revisionVisible.equals(/* true= */ 1))
            .and(teamsJoin.teamEnvironment.equals(environmentName))
        .select({
            title: tContent.contentTitle,
            markdown: tContent.content,
        })
        .orderBy(tContent.revisionDate, 'desc')
        .limit(1)
        .executeSelectNoneOrOne();

    if (!content)
        return undefined;

    if (substitutions) {
        content.title = content.title.replace(/\\\{([a-z0-9_]+)\}/gi, '{$1}');
        content.markdown = content.markdown.replace(/\\\{([a-z0-9_]+)\}/gi, '{$1}');

        for (const [ key, value ] of Object.entries(substitutions)) {
            content.title = content.title.replaceAll(`{${key}}`, value);
            content.markdown = content.markdown.replaceAll(`{${key}}`, value);
        }
    }

    return content;
}

/**
 * Fetches the content for the given `path` from the database, which lives there orthogonal to any
 * particular environment or event.
 *
 * @param path The path towards the content, relative from the domain root.
 * @param substitutions Content substitutions that should be applied, if any.
 * @returns Content object with the content when found, or undefined in all other cases.
 */
export async function getStaticContent(path: string[], substitutions?: ContentSubstitutions)
    : Promise<Content | undefined>
{
    return getContent(
        /* environment= */ 'stewards.team', /* event= */ { eventId: 0 } as any, path,
        substitutions);
}

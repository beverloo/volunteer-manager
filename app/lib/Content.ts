// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Environment } from '../Environment';
import type { Event } from './Event';
import db, { tContent, tTeams, tUsers } from './database';

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

    /**
     * First name of the author who authored the latest revision of the content.
     */
    authoredBy?: string;

    /**
     * Date on which this revision was published by the author.
     */
    authoredDate: string;
}

/**
 * Fetches content from the database for the given `path`, `event` and `environment` tuple. Will
 * run a database query to do so. Only the latest revision of a page will be included, all else will
 * be ignored as they are no longer deemed relevant.
 *
 * @param environment The environment for which to fetch the content.
 * @param event The event with which the content should be associated.
 * @param path The path towards the content, relative from the /registration/slug/ root.
 * @return Content object with the content when found, or undefined in all other cases.
 */
export async function getContent(environment: Environment, event: Event, path: string[])
        : Promise<Content | undefined> {
    const teamsJoin = tTeams.forUseInLeftJoin();
    const usersJoin = tUsers.forUseInLeftJoin();

    return await db.selectFrom(tContent)
        .leftJoin(usersJoin)
            .on(usersJoin.userId.equals(tContent.revisionAuthorId))
        .leftJoin(teamsJoin)
            .on(teamsJoin.teamId.equals(tContent.teamId))
        .where(tContent.eventId.equals(event.eventId))
            .and(tContent.contentPath.equals(path.join('/')))
            .and(teamsJoin.teamEnvironment.equals(environment))
        .select({
            title: tContent.contentTitle,
            markdown: tContent.content,
            authoredBy: usersJoin.firstName.concat(' ').concat(usersJoin.lastName),
            authoredDate: db.fragmentWithType('string', 'required')
                .sql`DATE_FORMAT(${tContent.revisionDate}, "%Y-%m-%d %T")`
        })
        .orderBy(tContent.revisionDate, 'desc')
        .limit(1)
        .executeSelectNoneOrOne() ?? undefined;
}

/**
 * Fetches the content for the given `path` from the database, which lives there orthogonal to any
 * particular environment or event.
 *
 * @param path The path towards the content, relative from the domain root.
 * @returns Content object with the content when found, or undefined in all other cases.
 */
export async function getStaticContent(path: string[]): Promise<Content | undefined> {
    return getContent(/* environment= */ 'stewards.team', /* event= */ { eventId: 0 } as any, path);
}

/**
 * Interface defining the information that will be made available about an individual volunteering
 * team, as fetched from the database so that it can be altered in the CMS.
 */
export interface TeamInformation {
    /**
     * Name briefly describing the team's identity.
     */
    name: string;

    /**
     * Description of the team's responsibilities.
     */
    description: string;
}

/**
 * Fetches information about the team that the given |environment| represents from the database.
 * Calling this function will issue a database query.
 */
export async function getTeamInformationForEnvironment(environment: Environment)
        : Promise<TeamInformation | undefined> {
    return await db.selectFrom(tTeams)
        .select({
            name: tTeams.teamName,
            description: tTeams.teamDescription,
        })
        .where(tTeams.teamEnvironment.equals(environment))
        .executeSelectNoneOrOne() || undefined;
}

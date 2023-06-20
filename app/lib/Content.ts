// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Environment } from '../Environment';
import { Event } from './Event';
import { sql } from './database';

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
    authoredBy: string;

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
 * @param path The path towards the content, relevant from the /registration/slug/ root.
 * @return Content object with the content when found, or undefined in all other cases.
 */
export async function getContent(environment: Environment, event: Event, path: string[])
        : Promise<Content | undefined> {
    const result =
        await sql`
            SELECT
                content.content_title AS title,
                content.content AS markdown,
                users.first_name AS authoredBy,
                content.revision_date AS authoredDate
            FROM
                content
            LEFT JOIN
                users ON users.user_id = content.revision_author_id
            LEFT JOIN
                teams ON teams.team_id = content.team_id
            WHERE
                content.event_id = ${event.eventId} AND
                content.content_path = ${path.join('/')} AND
                teams.team_environment = ${environment}
            ORDER BY
                content.revision_date DESC
            LIMIT
                1`;

    if (!result.ok || !result.rows.length)
        return undefined;

    return result.rows[0] as Content;
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
    const result =
        await sql`
            SELECT
                team_name,
                team_description
            FROM
                teams
            WHERE
                team_environment=${environment}`;

    if (!result.ok || !result.rows.length)
        return undefined;

    return {
        name: result.rows[0].team_name,
        description: result.rows[0].team_description,
    };
}

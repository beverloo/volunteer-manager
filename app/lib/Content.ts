// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Environment } from '../Environment';
import { sql } from './database';

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

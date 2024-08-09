// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { headers } from 'next/headers';

import type { PaletteMode } from '@mui/material';

import db, { tEnvironments, tTeams } from '@lib/database';

declare module globalThis {
    let animeConEnvironmentCache: Map<string, Environment> | undefined;
}

/**
 * Type to narrow the domain of an environment, which must have a TLD.
 */
export type EnvironmentDomain = `${string}.${string}`;

/**
 * Describes the environment in which the Volunteer Manager has been loaded. Only applicable for the
 * front-end, as the other sub applications are shared among the environments.
 */
export interface Environment {
    /**
     * Theme colours assigned to the environment, which decide the manager's appearance.
     */
    colours: { [key in PaletteMode]: string };

    /**
     * Description of the environment representing its purpose in slightly more words than its
     * title. Will be presented to visitors on the landing page.
     */
    description: string;

    /**
     * Domain name (e.g. "animecon.team") that represents this environment.
     */
    domain: EnvironmentDomain;

    /**
     * Title of the environment (e.g. "Volunteering Crew") representing its purpose.
     */
    title: string;

    // ---------------------------------------------------------------------------------------------
    // TODO: Clean up the following members to support 1:N environment:team relationships
    // ---------------------------------------------------------------------------------------------

    /**
     * Team that is associated with this environment. (E.g. "crew".)
     * @deprecated There isn't a 1:1 mapping between environments and teams, don't rely on this.
     */
    environmentTeamDoNotUse: string;

    /**
     * Name of the team that the environment represents. (E.g. "Crew".)
     */
    teamName: string;

    /**
     * Description of the team that this environment represents. May contain Markdown.
     */
    teamDescription: string;

    /**
     * Unique slug of the team as it should be identified in URLs.
     */
    teamSlug: string;

    /**
     * Theme colour of the environment. One must be set for each palette mode.
     */
    themeColours: { [key in PaletteMode]: string };
}

/**
 * Loads the environment configuration from the database, which will then be stored in the cache
 * (`kEnvironmentCache`) so that it can be quickly accessed thereafter.
 *
 * Environment configuration exists exclusively in the database. Adding a new environment is as easy
 * as creating a new row in the `teams` table and ensuring that the domain in the `team_environment`
 * column ends up with the Volunteer Manager.
 *
 * The cache will have to be cleared after changing team configuration or colour settings. This will
 * be done automatically in the applicable API calls (e.g. //api/admin/update-team), but may have
 * to be triggered manually when changing the database directly.
 */
async function loadEnvironmentsFromDatabase(): Promise<void> {
    const environments = await db.selectFrom(tTeams)
        .innerJoin(tEnvironments)
            .on(tEnvironments.environmentId.equals(tTeams.teamEnvironmentId))
        .select({
            colours: {
                dark: tEnvironments.environmentColourDarkMode,
                light: tEnvironments.environmentColourLightMode,
            },
            description: tEnvironments.environmentDescription,
            domain: tEnvironments.environmentDomain,
            title: tEnvironments.environmentTitle,

            // TODO: Categorise the following fields once we support 1:N environment -> team mapping
            environmentTeamDoNotUse: tTeams.teamSlug,
            teamName: tTeams.teamName,
            teamDescription: tTeams.teamDescription,
            teamSlug: tTeams.teamSlug,
            themeColours: {
                dark: tTeams.teamColourDarkTheme,
                light: tTeams.teamColourLightTheme,
            },
        })
        .executeSelectMany();

    globalThis.animeConEnvironmentCache = new Map();
    for (const environment of environments) {
        globalThis.animeConEnvironmentCache.set(environment.domain, {
            ...environment,
            domain: environment.domain as EnvironmentDomain,
        });
    }
}

/**
 * Determines what the current environment is based on the origin that content is being served from.
 * Will return "undefined" in case no appropriate environment can be found.
 */
export async function determineEnvironment(): Promise<Environment | undefined> {
    if (!globalThis.animeConEnvironmentCache)
        await loadEnvironmentsFromDatabase();

    const requestOrigin =
        /* dev environment= */   process.env.APP_ENVIRONMENT_OVERRIDE ??
        /* production server= */ headers().get('Host');

    for (const [ environmentName, environment ] of globalThis.animeConEnvironmentCache!.entries()) {
        if (requestOrigin?.endsWith(environmentName))
            return environment;
    }

    return undefined;
}

/**
 * Clears the environment cache. Should be called when environment settings have been updated, as
 * the cached configuration will no longer be valid after that has happened.
 */
export function clearEnvironmentCache() {
    globalThis.animeConEnvironmentCache = undefined;
}

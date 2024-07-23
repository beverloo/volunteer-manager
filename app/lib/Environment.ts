// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { headers } from 'next/headers';

import type { PaletteMode } from '@mui/material';

import db, { tTeams } from '@lib/database';

declare module globalThis {
    let animeConEnvironmentCache: Map<string, Environment> | undefined;
}

/**
 * Type that describes the name of an environment. Environment names are domain names, so must end
 * with a top-level domain such as ".team" or ".com".
 */
export type EnvironmentName = `${string}.${string}`;

/**
 * Describes the environment in which the Volunteer Manager has been loaded. Only applicable for the
 * front-end, as the other sub applications are shared among the environments.
 */
export interface Environment {
    /**
     * Internal ID of the environment.
     */
    id: number;

    /**
     * Name of the environment that this instance represents. (E.g. "animecon.team".)
     */
    environmentName: EnvironmentName;

    /**
     * Team that is associated with this environment. (E.g. "crew".)
     * @deprecated There isn't a 1:1 mapping between environments and teams, don't rely on this.
     */
    environmentTeamDoNotUse: string;

    /**
     * Title of the environment that this instance represents. (E.g. "Volunteering Crew".)
     */
    environmentTitle: string;

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
        .select({
            id: tTeams.teamId,
            teamName: tTeams.teamName,
            teamDescription: tTeams.teamDescription,
            teamEnvironment: tTeams.teamEnvironment,
            teamSlug: tTeams.teamSlug,
            teamTitle: tTeams.teamTitle,
            themeColourDark: tTeams.teamColourDarkTheme,
            themeColourLight: tTeams.teamColourLightTheme,
        })
        .executeSelectMany();

    globalThis.animeConEnvironmentCache = new Map();
    for (const environment of environments) {
        globalThis.animeConEnvironmentCache.set(environment.teamEnvironment, {
            id: environment.id,
            environmentName: environment.teamEnvironment as EnvironmentName,
            environmentTeamDoNotUse: environment.teamSlug,
            environmentTitle: environment.teamTitle,
            teamName: environment.teamName,
            teamDescription: environment.teamDescription,
            teamSlug: environment.teamSlug,
            themeColours: {
                dark: environment.themeColourDark,
                light: environment.themeColourLight,
            },
        });
    }
}

/**
 * Returns the environment identified by the given `environmentName`, or `undefined` when no such
 * environment could be found. May result in a database query, although results are cached.
 */
export async function getEnvironment(environmentName: EnvironmentName)
    : Promise<Environment | undefined>
{
    if (!globalThis.animeConEnvironmentCache)
        await loadEnvironmentsFromDatabase();

    return globalThis.animeConEnvironmentCache!.get(environmentName);
}

/**
 * Returns an iterator containing all environments that are known to the Volunteer Manager.
 */
export async function getEnvironmentIterator(): Promise<Iterable<Environment>> {
    if (!globalThis.animeConEnvironmentCache)
        await loadEnvironmentsFromDatabase();

    return globalThis.animeConEnvironmentCache!.values();
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

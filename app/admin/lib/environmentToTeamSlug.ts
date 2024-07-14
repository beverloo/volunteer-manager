// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Converts the given `environment` to a team's slug. Temporary while we migrate away from using
 * environment identifiers in URLs.
 */
export function environmentToTeamSlug(environment: string): string {
    switch (environment) {
        case 'animecon.team':
            return 'crew';
        case 'hosts.team':
            return 'hosts';
        case 'stewards.team':
            return 'stewards';
    }

    throw new Error(`Unrecognised environment: "${environment}"`);
}

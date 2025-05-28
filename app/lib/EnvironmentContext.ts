// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Environment } from './Environment';
import { getAuthenticationContext, type AuthenticationContext } from './auth/AuthenticationContext';

/**
 * Information associated with each event that is accessible in this environment. Personalised when
 * the visitor is signed in to an account with elevated privileges.
 */
interface EnvironmentContextEventAccess {
    // TODO: Define on the properties that need to be known for each event.
}

/**
 * The context associated with an environment, personalised to the signed in user, if any.
 */
type EnvironmentContext = Omit<AuthenticationContext, 'events'> & {
    /**
     * Array of events that are accessible within this environment. An environment may have zero or
     * more accessible events.
     */
    events: EnvironmentContextEventAccess[];
};

/**
 * Loads page context for the given `environment`. This involves authenticating the user and making
 * a determination which events and team combinations are accessible to them.
 */
export async function getEnvironmentContext(environment: Environment): Promise<EnvironmentContext> {
    const authenticationContext = await getAuthenticationContext();

    return {
        ...authenticationContext,
        events: await determineEventAccess(environment, authenticationContext),
    };
}

/**
 * Determines the events that the visitor has access to within the given `environment`. This fetches
 * all unsuspended events, and then filters it down to those that are accessible.
 */
async function determineEventAccess(
    environment: Environment, authenticationContext: AuthenticationContext)
        : Promise<EnvironmentContextEventAccess[]>
{
    const events: EnvironmentContextEventAccess[] = [ /* no events yet */ ];
    if (!environment.teams.length)
        return events;

    // TODO: Fetch events for the teams indicated in the |environment|
    // TODO: Filter those events for those accessible by the |authenticationContext|

    return events;
}

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { SessionData } from './Session';
import type { User } from './User';
import { AccessControl } from './AccessControl';
import { AuthType } from '@lib/database/Types';
import { Privilege, can } from './Privileges';
import { authenticateUser } from './Authentication';
import { getSessionFromCookieStore, getSessionFromHeaders } from './getSession';

// https://github.com/vercel/next.js/discussions/44270
const headers = import('next/headers');

/**
 * Authentication Context describing a particular user's access to a particular event. Senior
 * volunteering roles grant administrative access. Only active events will be considered.
 */
export interface UserEventAuthenticationContext {
    /**
     * Whether the user has admin access to this event, as opposed to regular participation.
     */
    admin: boolean;

    /**
     * Unique slug of the event ("2024"), through which it is identified in URLs.
     */
    event: string;

    /**
     * Unique slug of the team that the user is part of ("stewards.team").
     */
    team: string;
}

/**
 * Authentication Context specific to signed in users. Includes the user, as well as an overview of
 * the events that they've got access to.
 */
export interface UserAuthenticationContext {
    /**
     * The user who is currently signed in to their account.
     */
    user: User;

    /**
     * Authentication type that was used to sign the user in.
     */
    authType: AuthType;

    /**
     * Context regarding the user's access to events. Keyed by event slug ("2024"). Events won't be
     * included when the user does not have elevated access for an event.
     */
    events: Map<string, UserEventAuthenticationContext>;
}

/**
 * Authentication Context specific to visitors.
 */
export interface VisitorAuthenticationContext {
    /**
     * The user who is currently signed in to their account. Undefined for visitors.
     */
    user: undefined;
}

/**
 * Authentication Context, which defines not just the signed in user, but also detailed access
 * information about the level of access they have to different events.
 */
export type AuthenticationContext = {
    /**
     * Object that helps determine what permissions and privileges are granted to the visitor.
     */
    access: AccessControl;

} & (UserAuthenticationContext | VisitorAuthenticationContext);

/**
 * Determines the authentication context from the cookies included with the current request. May
 * only be used by server-side components, as authentication requires a database query.
 */
export async function getAuthenticationContext(): Promise<AuthenticationContext> {
    const sessionData = await getSessionFromCookieStore((await headers).cookies());
    if (sessionData)
        return getAuthenticationContextFromSessionData(sessionData);

    return {
        access: new AccessControl({ grants: 'everyone' }),
        user: /* guest= */ undefined,
    };
}

/**
 * Determines the authentication context based on the given `headers`. May only be used by server-
 * side components, as authentication requires a fdatabase query.
 */
export async function getAuthenticationContextFromHeaders(headers: Headers)
    : Promise<AuthenticationContext>
{
    const sessionData = await getSessionFromHeaders(headers);
    if (sessionData)
        return getAuthenticationContextFromSessionData(sessionData);

    return {
        access: new AccessControl({ grants: 'everyone' }),
        user: /* guest= */ undefined,
    }
}

/**
 * A set of privileges that should be checked in a particular manner.
 */
type PrivilegeSet = { type: 'and' | 'or', privileges: Privilege[] };

export const and = (...privileges: Privilege[]): PrivilegeSet => ({ type: 'and', privileges });
export const or = (...privileges: Privilege[]): PrivilegeSet => ({ type: 'or', privileges });

/**
 * Types of access check that can be executed. Each check should be individually documented.
 */
type AuthenticationAccessCheckTypes =
    /**
     * Access to the administrative area. This is the case when either:
     *   (1) The user has the EventAdministrator privilege,
     *   (2) The user has admin access because of an active event.
     */
    { check: 'admin' } |

    /**
     * Access to the administrative area for a particular event. This is the case when either:
     *   (1) The user has the Administrator privilege,
     *   (2) The user has admin access to the given `event`, which must be active.
     */
    { check: 'admin-event', event: string } |

    /**
     * Access to the schedule for a particular event. This is the case when either:
     *   (1) The user has the Administrator privilege,
     *   (2) The user has admin access to the given `event`, which must be active,
     *   (3) The event's schedule has been published by an event administrator.
     */
    { check: 'event', event: string } |

    /**
     * Access checks may be omitted in favour of only checking for privileges.
     */
    { };

/**
 * The access check always allows for permissions to be checked inline.
 */
type AuthenticationAccessCheck = AuthenticationAccessCheckTypes & {
    privilege?: Privilege | PrivilegeSet;
};

/**
 * Checks whether the `user` has been granted the given `privilege`, which may be a privilege set.
 */
function checkPrivilege(user: User | undefined, privilege: Privilege | PrivilegeSet): boolean {
    if (typeof privilege !== 'object')
        return can(user, privilege);

    let count = 0;
    for (const individualPrivilege of privilege.privileges)
        count += can(user, individualPrivilege) ? 1 : 0;

    return privilege.type === 'and' ? /* && */ count === privilege.privileges.length
                                    : /* || */ count > 0;
}

/**
 * Executes the given `access` check. The `type` determines what should be checked for, optionally
 * with additional parameters, and permissions can always be checked for. A HTTP 404 Not Found error
 * will be thrown when the access check fails.
 *
 * @note Access checks can be done inline when requiring an authentication context to exist.
 */
export function executeAccessCheck(
    context: AuthenticationContext, access: AuthenticationAccessCheck): void | never
{
    if (access.privilege) {
        if (!checkPrivilege(context.user, access.privilege))
            notFound();
    }

    if ('check' in access) {
        if (!context.user)
            notFound();

        switch (access.check) {
            case 'admin':
                if (!can(context.user, Privilege.EventAdministrator)) {
                    let eventsWithAdminAccess = 0;
                    for (const { admin } of context.events.values()) {
                        if (!!admin)
                            eventsWithAdminAccess++;
                    }

                    if (!eventsWithAdminAccess)
                        notFound();
                }
                break;

            case 'admin-event':
                if (!can(context.user, Privilege.EventAdministrator)) {
                    const eventAccess = context.events.get(access.event);
                    if (!eventAccess || !eventAccess.admin)
                        notFound();
                }
                break;

            case 'event':
                if (!can(context.user, Privilege.EventScheduleOverride)) {
                    if (!context.events.has(access.event))
                        notFound();
                }
                break;
        }
    }
}

/**
 * Determines the authentication context from the cookies included with the current request, and
 * will issue a HTTP 404 Not Found error when none could be loaded. May only be used by server-side
 * components, as authentication requires a database query.
 */
export async function requireAuthenticationContext(access?: AuthenticationAccessCheck)
    : Promise<UserAuthenticationContext>
{
    const authenticationContext = await getAuthenticationContext();
    if (!authenticationContext.user)
        notFound();

    if (access)
        executeAccessCheck(authenticationContext, access);

    return authenticationContext;
}

/**
 * Actually gets the authentication context from the given `sessionData`.
 */
async function getAuthenticationContextFromSessionData(sessionData: SessionData)
    : Promise<AuthenticationContext>
{
    return authenticateUser({ type: 'session', ...sessionData });
}

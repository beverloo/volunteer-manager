// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { RegistrationStatus } from '@lib/database/Types';
import db, { tEvents, tTeams, tUsersEvents, tUsers } from '@lib/database';

/**
 * Context that can be generated for a particular user.
 */
export interface UserContext {
    /**
     * Full name of the user who is supposedly writing this message.
     */
    name: string;

    /**
     * Name of the team that the user is part of. Only relevant when they are part of the event.
     */
    team?: string;
}

/**
 * Composes the given `context` in a series of individual strings, that can be added to the final
 * prompt context composition.
 */
export function composeUserContext(context: UserContext): string[] {
    return context.team ? [ `Your name is ${context.name}, part of the AnimeCon ${context.team}.` ]
                        : [ `Your name is ${context.name}.` ];
}

/**
 * Generates context for the user identified by the given `userId`. Optionally the `event` can be
 * passed, in which case context will be added regarding their role in the given event.
 */
export async function generateUserContext(userId: number, event?: string): Promise<UserContext> {
    const eventsJoin = tEvents.forUseInLeftJoin();
    const teamsJoin = tTeams.forUseInLeftJoin();
    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();

    return await db.selectFrom(tUsers)
        .leftJoin(eventsJoin)
            .on(eventsJoin.eventSlug.equals(event ?? 'invalid-eventz'))
            .and(eventsJoin.eventHidden.equals(/* false= */ 0))
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.userId.equals(tUsers.userId))
            .and(usersEventsJoin.eventId.equals(eventsJoin.eventId))
            .and(usersEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted))
        .leftJoin(teamsJoin)
            .on(teamsJoin.teamId.equals(usersEventsJoin.teamId))
        .where(tUsers.userId.equals(userId))
        .select({
            name: tUsers.name,
            team: teamsJoin.teamTitle,
        })
        .executeSelectOne();
}

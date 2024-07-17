// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import db, { tEventsTeams, tEvents, tTeams } from '@lib/database';

/**
 * Context that can be generated for an updated team.
 */
export interface UpdatedTeamContext {
    /**
     * Unique URL-safe slug of the event to which they applied.
     */
    event: string;

    /**
     * Name of the team to which the volunteer has been moved.
     */
    teamName: string;

    /**
     * Identity of that team, expressed as a domain name.
     */
    team: string;

    /**
     * Link to the WhatsApp group private to volunteers of this particular team. Optional.
     */
    whatsappLink?: string;
}

/**
 * Composes the given `context` in a series of individual strings, that can be added to the final
 * prompt context composition.
 */
export function composeUpdatedTeamContext(context: UpdatedTeamContext, approved?: boolean)
    : string[]
{
    const composition: string[] = [];

    const url = `https://${context.team}/registration/${context.event}/application`;

    composition.push(`They have been moved to the ${context.teamName} team instead.`);
    composition.push(
        'You must include the following link, where they can find more information and share ' +
        `their preferences: ${url}`);

    if (context.whatsappLink) {
        composition.push(
            'You must include the following link, which allows them to join the private ' +
            `WhatsApp group for volunteers: ${context.whatsappLink}`);
    }

    return composition;
}

/**
 * Generates context for the application by the given `userId` to participate in the `team` for the
 * given `event`. This is different from their existing team.
 */
export async function generateUpdatedTeamContext(userId: number, event: string, team: string)
    : Promise<UpdatedTeamContext>
{
    return await db.selectFrom(tTeams)
        .innerJoin(tEvents)
            .on(tEvents.eventSlug.equals(event))
        .innerJoin(tEventsTeams)
            .on(tEventsTeams.teamId.equals(tTeams.teamId))
            .and(tEventsTeams.eventId.equals(tEvents.eventId))
        .where(tTeams.teamSlug.equals(team))
        .select({
            event: db.const(event, 'string'),
            teamName: tTeams.teamTitle,
            team: db.const(team, 'string'),
            whatsappLink: tEventsTeams.whatsappLink,
        })
        .executeSelectOne();
}

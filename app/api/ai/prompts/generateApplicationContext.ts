// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { RegistrationStatus } from '@lib/database/Types';
import db, { tEventsTeams, tEvents, tTeams, tUsersEvents, tUsers } from '@lib/database';

/**
 * Context that can be generated for a particular application.
 */
export interface ApplicationContext {
    /**
     * Unique URL-safe slug of the event to which they applied.
     */
    event: string;

    /**
     * First name of the volunteer who applied for a position.
     */
    firstName: string;

    /**
     * Name of the team to which the volunteer applied.
     */
    teamName: string;

    /**
     * Description of the team that they are interested in joining.
     */
    teamDescription: string;

    /**
     * Identity of the team, expressed as a domain name.
     */
    team: string;

    /**
     * Link to the WhatsApp group private to volunteers of this particular team. Optional.
     */
    whatsappLink?: string;
}

/**
 * Composes the given `context` in a series of individual strings, that can be added to the final
 * prompt context composition. The `approved` boolean indicates whether the application is being
 * approved.
 */
export function composeApplicationContext(context: ApplicationContext, approved?: boolean)
    : string[]
{
    const composition: string[] = [];

    const { firstName, teamName, teamDescription } = context;

    composition.push(`You are messaging ${firstName}, who volunteered for the ${teamName}.`);
    if (approved) {
        const url = `https://${context.team}/registration/${context.event}/application`;

        composition.push(teamDescription.replaceAll(/\[([^\]]+)\]\(([^\)]+)\)/g, '$1'));
        composition.push(
            'You must include the following link, where they can find more information and share ' +
            `their preferences: ${url}.`);

        if (context.whatsappLink) {
            composition.push(
                'You must include the following link, which allows them to join the private ' +
                `WhatsApp group for volunteers: ${context.whatsappLink}.`);
        }
    }

    return composition;
}

/**
 * Generates context for the application by the given `userId` to participate in the `team` for the
 * given `event`.
 */
export async function generateApplicationContext(userId: number, event: string, team: string)
    : Promise<ApplicationContext>
{
    return await db.selectFrom(tUsersEvents)
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tUsersEvents.eventId))
            .and(tEvents.eventSlug.equals(event))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tUsersEvents.teamId))
            .and(tTeams.teamEnvironment.equals(team))
        .innerJoin(tEventsTeams)
            .on(tEventsTeams.eventId.equals(tUsersEvents.eventId))
            .and(tEventsTeams.teamId.equals(tUsersEvents.teamId))
        .where(tUsersEvents.userId.equals(userId))
        .select({
            event: tEvents.eventSlug,
            firstName: tUsers.firstName,
            teamName: tTeams.teamTitle,
            teamDescription: tTeams.teamDescription,
            team: tTeams.teamEnvironment,
            whatsApp: tEventsTeams.whatsappLink,
        })
        .executeSelectOne();

    // TODO: Previous participation
    // TODO: Hotel eligibility
    // TODO: Training eligibility
}

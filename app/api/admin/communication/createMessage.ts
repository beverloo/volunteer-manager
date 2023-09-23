// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { dayjs } from '@lib/DateTime';
import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { User } from '@lib/auth/User';
import { type ActionProps, noAccess } from '../../Action';
import { Privilege, can } from '@lib/auth/Privileges';
import { RegistrationStatus } from '@lib/database/Types';
import { VertexPromptBuilder } from '@lib/VertexPromptBuilder';
import { readSetting } from '@lib/Settings';
import db, { tEvents, tTeams, tUsers, tUsersEvents } from '@lib/database';

/**
 * Interface definition for the Communication API, exposed through /api/admin/communication.
 */
export const kCreateMessageDefinition = z.object({
    request: z.object({
        /**
         * Type of message that should be created. The types must be strict suffixes of the
         * `integration-prompt-*` types defined in `SettingsMap` in `/app/lib/Settings.ts`.
         */
        type: z.enum([
            'approve-volunteer',
            'reject-volunteer',
        ]),

        /**
         * The event (slug) for which the message should be created.
         */
        event: z.string(),

        /**
         * Language in which the message should be written. Only English and Dutch are supported for
         * now, although the underlying Vertex AI API is available in over 40 languages.
         */
        language: z.enum([ 'en', 'nl' ]),

        /**
         * Unique ID of the team regarding which this message is in scope.
         */
        teamId: z.coerce.number(),

        /**
         * Unique ID of the user to whom the message should be send.
         */
        userId: z.coerce.number(),
    }),
    response: z.strictObject({
        /**
         * The message that has been created for this volunteer.
         */
        message: z.string(),

        /**
         * The prompt that led to the `message` may optionally be included.
         */
        prompt: z.string().optional(),
    }),
});

export type CreateMessageDefinition = z.infer<typeof kCreateMessageDefinition>;

/**
 * Appends context about the application the `userId` made to participate in the `teamId` during
 * the `event` to the given `builder`, such as their preferences.
 */
async function appendApplicationContext(
    builder: VertexPromptBuilder, event: string, teamId: number, userId: number): Promise<void>
{
    const info = await db.selectFrom(tUsersEvents)
        .innerJoin(tUsers)
            .on(tUsers.userId.equals(tUsersEvents.userId))
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tUsersEvents.eventId))
            .and(tEvents.eventSlug.equals(event))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tUsersEvents.teamId))
        .where(tUsersEvents.userId.equals(userId))
            .and(tUsersEvents.teamId.equals(teamId))
            .and(tUsersEvents.registrationStatus.equals(RegistrationStatus.Registered))
        .select({
            name: tUsers.firstName.concat(' '),
            teamName: tTeams.teamTitle,
            teamEnvironment: tTeams.teamEnvironment,
        })
        .executeSelectNoneOrOne();

    if (!info)
        return;

    const url = `https://${info.teamEnvironment}/registration/${event}/application`;

    builder
        .withContext(`You are messaging ${info.name}, who volunteered for the ${info.teamName}.`)
        .withContext(`If it is appropriate, tell them they can follow their application on ${url}.`)
        .withContext('They can also find more information and share preferences on that page.');

    // TODO: Previous participation
    // TODO: Hotel eligibility
    // TODO: Training eligibility
}

/**
 * Appends context about the `event` to the given `builder`, such as its name and dates.
 */
async function appendEventContext(builder: VertexPromptBuilder, event: string): Promise<void> {
    const info = await db.selectFrom(tEvents)
        .where(tEvents.eventSlug.equals(event))
        .select({
            name: tEvents.eventShortName,
            location: tEvents.eventLocation,
            startTime: tEvents.eventStartTime,
            endTime: tEvents.eventEndTime,
        })
        .executeSelectNoneOrOne();

    if (!info)
        return;

    const today = dayjs().format('MMMM D, YYYY');
    const start = dayjs(info.startTime).format('MMMM D, YYYY');
    const end = dayjs(info.endTime).format('MMMM D, YYYY');

    builder
        .withContext(`Today's date is ${today}.`)
        .withContext(`You are writing about ${info.name}, happening from ${start} to ${end}.`);

    if (info.location)
        builder.withContext(`The event takes place in ${info.location}.`);
}

/**
 * Creates a new prompt for the given `user`, who is part of the given `teamId`.
 */
async function createPromptForUser(teamId: number, user: User): Promise<VertexPromptBuilder> {
    const teamInfo = await db.selectFrom(tTeams)
        .where(tTeams.teamId.equals(teamId))
        .select({
            name: tTeams.teamTitle,
            description: tTeams.teamDescription,
        })
        .executeSelectNoneOrOne();

    const name = `${user.firstName} ${user.lastName}`;
    const team = teamInfo?.name ?? 'AnimeCon volunteering teams';

    const teamContext = teamInfo?.description.replace(/\[(.+?)\]\((.*?)\)/g, '$1');

    // TODO: Allow people to modify the writing style to themselves.
    return VertexPromptBuilder.createForPerson(name, team)
        .withContext(teamContext || '')
        .withHumour('Never')
        .withIdentity('Team')
        .withTone('Cooperative');
}

type Request = CreateMessageDefinition['request'];
type Response = CreateMessageDefinition['response'];

/**
 * API to create new a new communication based on particular conditions.
 */
export async function createMessage(request: Request, props: ActionProps): Promise<Response> {
    let promptSetting: `integration-prompt-${Request['type']}`;

    // ---------------------------------------------------------------------------------------------
    // Step 1: Access checks and prompt selection.
    // ---------------------------------------------------------------------------------------------

    switch (request.type) {
        case 'approve-volunteer':
        case 'reject-volunteer':
            if (!can(props.user, Privilege.EventApplicationManagement))
                noAccess();

            promptSetting =
                request.type === 'approve-volunteer' ? 'integration-prompt-approve-volunteer'
                                                     : 'integration-prompt-reject-volunteer';
            break;
    }

    if (!promptSetting || !props.user)
        notFound();

    // ---------------------------------------------------------------------------------------------
    // Step 2: Prompt context selection.
    // ---------------------------------------------------------------------------------------------

    const prompt = await createPromptForUser(request.teamId, props.user);
    await appendEventContext(prompt, request.event);

    switch (request.type) {
        case 'approve-volunteer':
        case 'reject-volunteer':
            await appendApplicationContext(prompt, request.event, request.teamId, request.userId);
            break;
    }

    switch (request.language) {
        case 'en':
            // English is the default language for prompts.
            break;

        case 'nl':
            prompt.withContext('Write the message in Dutch.');
            prompt.withContext('Use "deelname" as the translation for "application".');
            break;
    }

    // ---------------------------------------------------------------------------------------------
    // Step 3: Prompt creation and personalistion.
    // ---------------------------------------------------------------------------------------------

    //const prompt = VertexPromptBuilder.createForPerson(props.user.firstName, null);

    const situation = await readSetting(promptSetting);
    if (situation)
        prompt.forSituation(situation);

    // ---------------------------------------------------------------------------------------------
    // Step 4: Issue the Vertex AI / LLM call and return the result.
    // ---------------------------------------------------------------------------------------------

    return { message: '...', prompt: prompt.build() };
}

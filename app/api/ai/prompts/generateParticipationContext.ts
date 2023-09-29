// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type ApplicationContext, generateApplicationContext } from './generateApplicationContext';

/**
 * Context that can be generated for a particular participation.
 */
export type ParticipationContext = ApplicationContext;

/**
 * Generates composed sentences based on the `context`, describing someone's participation.
 */
export function composeParticipationContext(context: ParticipationContext, reinstated?: boolean)
    : string[]
{
    const composition: string[] = [];
    const tense = reinstated ? 'is' : 'was';

    const { firstName, teamName } = context;

    composition.push(`You are messaging ${firstName}, who ${tense} part of the ${teamName}.`);
    if (reinstated) {
        const url = `https://${context.team}/registration/${context.event}/application`;

        composition.push(
            'You must include the following link, where they can find more information and share ' +
            `their preferences: ${url}.`);
    }

    return composition;
}

/**
 * Generates context for the given `userId` their participation in the `team` for the `event`.
 */
export const generateParticipationContext = generateApplicationContext;

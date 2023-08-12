// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { LogType, Log } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import { isUsernameAvailable } from '@lib/auth/Authentication';
import { sql } from '@lib/database';

/**
 * Interface definition for the Volunteer API, exposed through /api/admin/update-volunteer.
 */
export const kUpdateVolunteerDefinition = z.object({
    request: z.object({
        /**
         * ID of the user for whom information is being updated.
         */
        userId: z.number(),

        /**
         * The volunteer's first name. Will override the current first name.
         */
        firstName: z.string(),

        /**
         * The volunteer's last name. Will override the current last name.
         */
        lastName: z.string(),

        /**
         * The volunteer's username. Must be unique, even after being updated.
         */
        username: z.string().optional(),

        /**
         * The volunteer's gender. Arbitrary string.
         */
        gender: z.string(),

        /**
         * Date on which the user was born. (YYYY-MM-DD)
         */
        birthdate: z.string().regex(/^[1|2](\d{3})\-(\d{2})-(\d{2})$/).optional(),

        /**
         * Phone number of the user, in an undefined format.
         */
        phoneNumber: z.string().optional(),
    }),
    response: z.strictObject({
        /**
         * Whether the updates were stored successfully.
         */
        success: z.boolean(),

        /**
         * Optional error message to show when something goes wrong.
         */
        error: z.string().optional(),
    }),
});

export type UpdateVolunteerDefinition = z.infer<typeof kUpdateVolunteerDefinition>;

type Request = UpdateVolunteerDefinition['request'];
type Response = UpdateVolunteerDefinition['response'];

/**
 * API that allows the information of a particular volunteer to be updated. Only select accounts
 * have the ability to call into this endpoint.
 */
export async function updateVolunteer(request: Request, props: ActionProps): Promise<Response> {
    if (!can(props.user, Privilege.AccessVolunteers))
        noAccess();

    const existingResult = await sql`
        SELECT
            users.username,
            users.first_name,
            users.last_name,
            users.gender,
            users.birthdate,
            users.phone_number
        FROM
            users
        WHERE
            users.user_id = ${request.userId}`;

    if (!existingResult.ok || !existingResult.rows.length)
        return { success: false, error: 'Unable to fetch existing user information' };

    const user = existingResult.rows[0];

    if (typeof request.username === 'string' && request.username !== user.username) {
        const available = await isUsernameAvailable(request.username);
        if (!available)
            return { success: false, error: 'There already is an account with that email address' };
    }

    const updateResult = await sql`
        UPDATE
            users
        SET
            users.username = ${request.username},
            users.first_name = ${request.firstName},
            users.last_name = ${request.lastName},
            users.gender = ${request.gender},
            users.birthdate = ${request.birthdate},
            users.phone_number = ${request.phoneNumber}
        WHERE
            users.user_id = ${request.userId}
        LIMIT
            1`;

    if (!updateResult.ok || !updateResult.affectedRows)
        return { success: false, error: 'Unable to update the existing user information' };

    Log({
        type: LogType.AdminUpdateVolunteer,
        sourceUser: props.user,
        targetUser: request.userId,
        data: { ip: props.ip, user }
    });

    return { success: true };
}

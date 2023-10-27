// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import { Log, LogType, LogSeverity } from '@lib/Log';
import { Privilege } from '@lib/auth/Privileges';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import { isUsernameAvailable } from '@lib/auth/Authentication';
import db, { tUsers } from '@lib/database';

import { kAccountFields } from '../auth/updateAccount';

/**
 * Interface definition for the Volunteer API, exposed through /api/admin/update-volunteer.
 */
export const kUpdateVolunteerDefinition = z.object({
    request: kAccountFields.and(z.object({
        /**
         * ID of the user for whom information is being updated.
         */
        userId: z.number(),
    })),
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
    executeAccessCheck(props.authenticationContext, {
        check: 'admin',
        privilege: Privilege.VolunteerAdministrator,
    });

    const user = await db.selectFrom(tUsers)
        .select({
            username: tUsers.username,
            firstName: tUsers.firstName,
            lastName: tUsers.lastName,
            gender: tUsers.gender,
            birthdate: tUsers.birthdate,
            phoneNumber: tUsers.phoneNumber
        })
        .where(tUsers.userId.equals(request.userId))
        .executeSelectNoneOrOne();

    if (!user)
        return { success: false, error: 'Unable to fetch existing user information' };

    if (typeof request.username === 'string' && request.username !== user.username) {
        const available = await isUsernameAvailable(request.username);
        if (!available)
            return { success: false, error: 'There already is an account with that email address' };
    }

    const affectedRows = await db.update(tUsers)
        .set({
            username: request.username,
            firstName: request.firstName,
            lastName: request.lastName,
            gender: request.gender,
            birthdate: request.birthdate ? new Date(request.birthdate) : null,
            phoneNumber: request.phoneNumber,
        })
        .where(tUsers.userId.equals(request.userId))
        .executeUpdate();

    if (!affectedRows)
        return { success: false, error: 'Unable to update the existing user information' };

    await Log({
        type: LogType.AdminUpdateVolunteer,
        severity: LogSeverity.Warning,
        sourceUser: props.user,
        targetUser: request.userId,
        data: { ip: props.ip, user }
    });

    return { success: true };
}

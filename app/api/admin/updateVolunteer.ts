// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { Log, LogType, LogSeverity } from '@lib/Log';
import { Temporal } from '@lib/Temporal';
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

        /**
         * The name using which the volunteer should be identified throughout our system.
         */
        displayName: z.string().optional(),
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

export type UpdateVolunteerDefinition = ApiDefinition<typeof kUpdateVolunteerDefinition>;

type Request = ApiRequest<typeof kUpdateVolunteerDefinition>;
type Response = ApiResponse<typeof kUpdateVolunteerDefinition>;

/**
 * API that allows the information of a particular volunteer to be updated. Only select accounts
 * have the ability to call into this endpoint.
 */
export async function updateVolunteer(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin',
        permission: {
            permission: 'volunteer.account.information',
            operation: 'update',
        },
    });

    const user = await db.selectFrom(tUsers)
        .select({
            username: tUsers.username,
            firstName: tUsers.firstName,
            lastName: tUsers.lastName,
            displayName: tUsers.displayName,
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

    const displayName =
        (!!request.displayName && !!request.displayName.length)
            ? request.displayName
            : null;

    const affectedRows = await db.update(tUsers)
        .set({
            username: request.username,
            firstName: request.firstName,
            lastName: request.lastName,
            displayName,
            gender: request.gender,
            birthdate: request.birthdate ? Temporal.PlainDate.from(request.birthdate) : null,
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

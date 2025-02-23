// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { ActionProps } from '../Action';
import type { ApiDefinition, ApiRequest, ApiResponse } from '../Types';
import { RecordLog, kLogSeverity, kLogType } from '@lib/Log';
import { executeAccessCheck } from '@lib/auth/AuthenticationContext';
import db, { tUsersAuth } from '@lib/database';

import { kAuthType } from '@lib/database/Types';

/**
 * Interface definition for the Access Code API, exposed through /api/admin/reset-access-code.
 */
export const kResetAccessCodeDefinition = z.object({
    request: z.object({
        /**
         * ID of the user for whom a new access code is being requested.
         */
        userId: z.number(),
    }),
    response: z.strictObject({
        /**
         * The access code that can now be shared with the volunteer.
         */
        accessCode: z.string().optional(),
    }),
});

export type ResetAccessCodeDefinition = ApiDefinition<typeof kResetAccessCodeDefinition>;

type Request = ApiRequest<typeof kResetAccessCodeDefinition>;
type Response = ApiResponse<typeof kResetAccessCodeDefinition>;

/**
 * API that allows a new access code to be created for a particular volunteer. Only certain
 * volunteers have the ability to request new access codes.
 */
export async function resetAccessCode(request: Request, props: ActionProps): Promise<Response> {
    executeAccessCheck(props.authenticationContext, {
        check: 'admin',
        permission: 'volunteer.account',
    });

    RecordLog({
        type: kLogType.AdminResetAccessCode,
        severity: kLogSeverity.Warning,
        sourceUser: props.user,
        targetUser: request.userId,
        data: { ip: props.ip }
    })

    const existingAccessCode = await db.selectFrom(tUsersAuth)
        .select({ accessCode: tUsersAuth.authValue })
        .where(tUsersAuth.userId.equals(request.userId))
        .and(tUsersAuth.authType.equals(kAuthType.code))
        .executeSelectNoneOrOne();

    if (!!existingAccessCode)
        return { accessCode: `${existingAccessCode.accessCode}` };

    const accessCode = Math.floor(Math.random() * (9999 - 1000) + 1000);
    const insertedAccessCode = await db.insertInto(tUsersAuth)
        .values({
            userId: request.userId,
            authType: kAuthType.code,
            authValue: `${accessCode}`,
        })
        .executeInsert();

    if (!!insertedAccessCode)
        return { accessCode: `${accessCode}` };

    return { /* error condition */ };
}

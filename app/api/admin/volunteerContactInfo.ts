// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { Log, LogSeverity, LogType } from '@lib/Log';
import { Privilege, can } from '@lib/auth/Privileges';
import db, { tUsers } from '@lib/database';

/**
 * Interface definition for the Volunteer API, exposed through /api/admin/volunteer-contact-info.
 */
export const kVolunteerContactInfoDefinition = z.object({
    request: z.object({
        /**
         * ID of the event for which this information is being requested.
         */
        eventId: z.number(),

        /**
         * ID of the team for which this information is being requested.
         */
        teamId: z.number(),

        /**
         * ID of the user whose contact information is being requested.
         */
        userId: z.number(),
    }),
    response: z.strictObject({
        /**
         * The username (e-mail address) owned by this volunteer.
         */
        username: z.string().optional(),

        /**
         * The phone number through which we can reach this volunteer.
         */
        phoneNumber: z.string().optional(),
    }),
});

export type VolunteerContactInfoDefinition = z.infer<typeof kVolunteerContactInfoDefinition>;

type Request = VolunteerContactInfoDefinition['request'];
type Response = VolunteerContactInfoDefinition['response'];

/**
 * API that allows event administrators and senior volunteers in particular events to retrieve the
 * contact information of certain volunteers. Access to this information is recorded.
 */
export async function volunteerContactInfo(request: Request, props: ActionProps)
    : Promise<Response>
{
    if (!can(props.user, Privilege.EventAdministrator))
        noAccess();

    // TODO: Proper access checks for seniors.

    const contactInformation = await db.selectFrom(tUsers)
        .where(tUsers.userId.equals(request.userId))
        .select({
            username: tUsers.username,
            phoneNumber: tUsers.phoneNumber,
        })
        .executeSelectNoneOrOne();

    if (contactInformation) {
        await Log({
            type: LogType.AdminAccessVolunteerInfo,
            severity: LogSeverity.Info,
            sourceUser: props.user,
            targetUser: request.userId,
            data: {
                ip: props.ip,
            }
        });
    }

    return contactInformation ?? { /* empty response */ };
}

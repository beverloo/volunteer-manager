// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import { type ActionProps, noAccess } from '../Action';
import { LogType, Log } from '@lib/Log';
import db, { tUsers } from '@lib/database';
import dayjs from 'dayjs';

/**
 * Fields that describe the identifyable information stored with a volunteer's profile.
 */
export const kAccountFields = z.object({
    /**
     * The volunteer's first name.
     */
    firstName: z.string(),

    /**
     * The volunteer's last name.
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
});

/**
 * Interface definition for the UpdateAccount API, exposed through /api/auth/update-account.
 */
export const kUpdateAccountDefinition = z.object({
    request: z.object({
        /**
         * The update
         */
        update: kAccountFields.optional(),
    }),
    response: z.strictObject({
        /**
         * Whether the sign out operation could be completed successfully.
         */
        success: z.boolean(),

        /**
         * Optional error message in case `success` is set to false.
         */
        error: z.string().optional(),

        /**
         * The volunteer's account fields, when retrieving information.
         */
        account: kAccountFields.optional(),
    }),
});

export type UpdateAccountDefinition = z.infer<typeof kUpdateAccountDefinition>;

type Request = UpdateAccountDefinition['request'];
type Response = UpdateAccountDefinition['response'];

/**
 * API that allows a user to update their account.
 */
export async function updateAccount(request: Request, props: ActionProps): Promise<Response> {
    if (!props.user)
        return noAccess();

    const account = await db.selectFrom(tUsers)
        .where(tUsers.userId.equals(props.user.userId))
        .select({
            firstName: tUsers.firstName,
            lastName: tUsers.lastName,
            username: tUsers.username,
            gender: tUsers.gender,
            birthdate: tUsers.birthdate,
            phoneNumber: tUsers.phoneNumber,
        })
        .executeSelectNoneOrOne();

    if (!account)
        notFound();

    // (1) Information retrieval API.
    if (!request.update) {
        return {
            success: true,
            account: {
                ...account,
                birthdate: account.birthdate ? dayjs(account.birthdate).format('YYYY-MM-DD')
                                             : undefined,
            }
        };
    }

    // (2) Information update API.
    const { update } = request;

    if (!update.firstName.length)
        return { success: false, error: 'You need to fill in your first name.' };
    if (!update.lastName.length)
        return { success: false, error: 'You need to fill in your last name.' };
    if (!update.gender.length)
        return { success: false, error: 'You need to fill in your gender.' };
    if (update.birthdate?.length !== 10)
        return { success: false, error: 'You need to fill in your date of birth.' };
    if (!update.phoneNumber || update.phoneNumber.length < 8)
        return { success: false, error: 'You need to fill in your phone number.' };

    await db.update(tUsers)
        .set({
            firstName: update.firstName,
            lastName: update.lastName,
            gender: update.gender,
            birthdate: new Date(update.birthdate),
            phoneNumber: update.phoneNumber
        })
        .where(tUsers.userId.equals(props.user.userId))
        .executeUpdate();

    await Log({
        type: LogType.AccountUpdate,
        sourceUser: props.user,
        data: {
            ip: props.ip,
            ...account
        },
    });

    return { success: true };
}

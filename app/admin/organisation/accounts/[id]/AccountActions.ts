// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';
import { z } from 'zod';

import { RecordLog, kLogSeverity, kLogType } from '@lib/Log';
import { executeServerAction } from '@lib/serverAction';
import { isUsernameAvailable } from '@lib/auth/Authentication';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tUsers } from '@lib/database';

import { kTemporalPlainDate } from '@app/api/Types';

/**
 * Zod type that describes that no data is expected.
 */
const kNoDataRequired = z.object({ /* no parameters */ });

/**
 * Server action that activates the account identified by the given `userId`.
 */
export async function activateAccount(userId: number, formData: unknown) {
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: 'organisation.accounts',
        });

        return { success: false, error: 'Not yet implemented' };
    });
}

/**
 * Server action that associates an access code with the account identified by the given `userId`
 */
export async function createAccessCode(userId: number, formData: unknown) {
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: 'organisation.accounts',
        });

        return { success: false, error: 'Not yet implemented' };
    });
}

/**
 * Server action that deactivates the account identified by the given `userId`
 */
export async function deactivateAccount(userId: number, formData: unknown) {
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: 'organisation.accounts',
        });

        return { success: false, error: 'Not yet implemented' };
    });
}

/**
 * Server action that signs the user in to the account identified by the given `userId`
 */
export async function impersonate(userId: number, formData: unknown) {
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: 'organisation.impersonation',
        });

        return { success: false, error: 'Not yet implemented' };
    });
}

/**
 * Server action resets the password of the account identified by the given `userId`
 */
export async function resetPassword(userId: number, formData: unknown) {
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: 'organisation.accounts',
        });

        return { success: false, error: 'Not yet implemented' };
    });
}

/**
 * Data associated with a account information update.
 */
const kAccountPermissionData = z.object({
    firstName: z.string().nonempty(),
    lastName: z.string().nonempty(),
    displayName: z.string().optional(),
    birthdate: kTemporalPlainDate.nullish(),
    gender: z.string().optional(),
    username: z.string().optional(),
    phoneNumber: z.string().optional(),
    discordHandle: z.string().optional(),
});

/**
 * Server Action called when the account information is being updated.
 */
export async function updateAccountInformation(userId: number, formData: unknown) {
    'use server';
    return executeServerAction(formData, kAccountPermissionData, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: 'organisation.accounts',
        });

        const currentUser = await db.selectFrom(tUsers)
            .where(tUsers.userId.equals(userId))
            .select({
                firstName: tUsers.firstName,
                lastName: tUsers.lastName,
                displayName: tUsers.displayName,
                birthdate: db.dateAsString(tUsers.birthdate),
                gender: tUsers.gender,
                username: tUsers.username,
                phoneNumber: tUsers.phoneNumber,
                discordHandle: tUsers.discordHandle,
            })
            .executeSelectNoneOrOne();

        if (!currentUser)
            notFound();

        if (typeof data.username === 'string' && data.username !== currentUser.username) {
            const available = await isUsernameAvailable(data.username);
            if (!available)
                return { success: false, error: 'This e-mail address is already in use' };
        }

        const affectedRows = await db.update(tUsers)
            .set({
                firstName: data.firstName,
                lastName: data.lastName,
                displayName: data.displayName?.length ? data.displayName : null,
                birthdate: data.birthdate,
                gender: data.gender,
                username: data.username,
                phoneNumber: data.phoneNumber,
                discordHandle: data.discordHandle,
            })
            .where(tUsers.userId.equals(userId))
            .executeUpdate();

        if (!affectedRows)
            return { success: false, error: 'Unable to update the existing user information' };

        RecordLog({
            type: kLogType.AdminUpdateVolunteer,
            severity: kLogSeverity.Warning,
            sourceUser: props.user,
            targetUser: userId,
            data: {
                user: currentUser
            }
        });

        return { success: true, refresh: true };
    });
}

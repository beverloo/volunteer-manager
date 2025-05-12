// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { z } from 'zod';

import { RecordLog, kLogSeverity, kLogType } from '@lib/Log';
import { executeServerAction } from '@lib/serverAction';
import { authenticateUser, getUserSessionToken, isUsernameAvailable } from '@lib/auth/Authentication';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import { writeSealedSessionCookieToStore } from '@lib/auth/Session';
import db, { tUsers, tUsersAuth } from '@lib/database';

import { kAuthType } from '@lib/database/Types';
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

        const affectedRows = await db.update(tUsers)
            .set({
                activated: /* true= */ 1
            })
            .where(tUsers.userId.equals(userId))
            .executeUpdate();

        if (!affectedRows)
            return { success: false, error: 'Unable to activate their account…' };

        RecordLog({
            type: kLogType.AdminUpdateActivation,
            sourceUser: props.user,
            targetUser: userId,
            data: {
                activated: true,
            },
        });

        return {
            success: true,
            message: 'Their account has been activated',
            refresh: true,
        };
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

        RecordLog({
            type: kLogType.AdminResetAccessCode,
            severity: kLogSeverity.Warning,
            sourceUser: props.user,
            targetUser: userId,
        })

        let accessCode = await db.selectFrom(tUsersAuth)
            .where(tUsersAuth.userId.equals(userId))
                .and(tUsersAuth.authType.equals(kAuthType.code))
            .selectOneColumn(tUsersAuth.authValue)
            .executeSelectNoneOrOne();

        if (!accessCode) {
            accessCode = `${Math.floor(Math.random() * (9999 - 1000) + 1000)}`;

            const insertedAccessCode = await db.insertInto(tUsersAuth)
                .values({
                    userId: userId,
                    authType: kAuthType.code,
                    authValue: `${accessCode}`,
                })
                .executeInsert();

            if (!insertedAccessCode)
                return { success: false, message: 'Unable to create a new access code…' };
        }

        return { success: true, message: `Their access code is: **${accessCode}**`}
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

        const affectedRows = await db.update(tUsers)
            .set({
                activated: /* false= */ 0
            })
            .where(tUsers.userId.equals(userId))
            .executeUpdate();

        if (!affectedRows)
            return { success: false, error: 'Unable to deactivate their account…' };

        RecordLog({
            type: kLogType.AdminUpdateActivation,
            sourceUser: props.user,
            targetUser: userId,
            data: {
                activated: false,
            },
        });

        return {
            success: true,
            message: 'Their account has been deactivated',
            refresh: true,
        };
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

        const { user: impersonatedUser } = await authenticateUser({ type: 'userId', userId });

        const impersonatedUserSessionToken = await getUserSessionToken(userId);
        const userSessionToken = await getUserSessionToken(props.user!.userId);

        if (!impersonatedUser || !impersonatedUserSessionToken || !userSessionToken)
            return { success: false, error: 'Unable to find the user to impersonate' };

        await writeSealedSessionCookieToStore({
            id: impersonatedUser.userId,
            token: impersonatedUserSessionToken,
            parent: {
                id: props.user!.userId,
                token: userSessionToken,
            },
        }, await cookies());

        RecordLog({
            type: kLogType.AdminImpersonateVolunteer,
            severity: kLogSeverity.Warning,
            sourceUser: props.user,
            targetUser: impersonatedUser,
        });

        return {
            success: true,
            message: 'Impersonation successful. You are being redirected…',
            redirect: '/',
        };
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

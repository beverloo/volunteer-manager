// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { z } from 'zod';

import { RecordLog, kLogSeverity, kLogType } from '@lib/Log';
import { executeServerAction } from '@lib/serverAction';
import { authenticateUser, getUserSessionToken, isUsernameAvailable } from '@lib/auth/Authentication';
import { clearPageMetadataCache } from '@app/admin/lib/generatePageMetadata';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import { sealPasswordResetRequest } from '@lib/auth/PasswordReset';
import { setExampleMessagesForUser } from '@app/admin/lib/getExampleMessagesForUser';
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
            permission: {
                permission: 'organisation.accounts',
                operation: 'update',
            },
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
 * Server action that confirms the account's associated Discord handle as having been verified.
 */
export async function confirmDiscord(userId: number, formData: unknown) {
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: {
                permission: 'organisation.accounts',
                operation: 'update',
            },
        });

        const affectedRows = await db.update(tUsers)
            .set({
                discordHandleUpdated: null,
            })
            .where(tUsers.userId.equals(userId))
                .and(tUsers.discordHandleUpdated.isNotNull())
            .executeUpdate();

        if (!affectedRows)
            return { success: false, error: 'The verification could not be stored…' };

        RecordLog({
            type: kLogType.AdminVerifyDiscord,
            severity: kLogSeverity.Warning,
            sourceUser: props.user,
            targetUser: userId,
        });

        return { success: true };
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
            permission: {
                permission: 'organisation.accounts',
                operation: 'update',
            },
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
 * Zod type that describes the data required when creating an account.
 */
const kCreateAccountData = z.object({
    username: z.string().email(),
    gender: z.string().nonempty(),
    firstName: z.string().nonempty(),
    lastName: z.string().nonempty(),
});

/**
 * Server action that creates an account with the given `formData`.
 */
export async function createAccount(formData: unknown) {
    'use server';
    return executeServerAction(formData, kCreateAccountData, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: {
                permission: 'organisation.accounts',
                operation: 'create',
            },
        });

        if (!isUsernameAvailable(data.username))
            return { success: false, error: 'This e-mail address already has an account…' };

        const userId = await db.insertInto(tUsers)
            .set({
                username: data.username,
                gender: data.gender,
                firstName: data.firstName,
                lastName: data.lastName,
                activated: /* true= */ 1,
            })
            .returningLastInsertedId()
            .executeInsert();

        if (!userId)
            return { success: false, error: 'Unable to store the new account in the database…' };

        // Note that we deliberately do not publish creation of this account, as this is considered
        // an override action by an administrator. For similar reasons we don't send them an e-mail
        // that their account has been created either.

        RecordLog({
            type: kLogType.AccountRegister,
            sourceUser: props.user,
            targetUser: userId,
        });

        return {
            success: true,
            redirect: `/admin/organisation/accounts/${userId}`,
        };
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
            permission: {
                permission: 'organisation.accounts',
                operation: 'update',
            },
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
            notFound();

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
            permission: {
                permission: 'organisation.accounts',
                operation: 'update',
            },
        });

        const user = await db.selectFrom(tUsers)
            .select({ sessionToken: tUsers.sessionToken })
            .where(tUsers.userId.equals(userId))
            .executeSelectNoneOrOne();

        if (!user)
            notFound();

        const passwordResetRequest = await sealPasswordResetRequest({
            id: userId,
            token: user.sessionToken
        });

        RecordLog({
            type: kLogType.AdminResetPasswordLink,
            severity: kLogSeverity.Warning,
            sourceUser: props.user,
            targetUser: userId,
        });

        const passwordResetLink =
            `https://${props.host}/?password-reset-request=${passwordResetRequest}`;

        return { success: true, message: passwordResetLink };
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
            permission: {
                permission: 'organisation.accounts',
                operation: 'update',
            },
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

        // The account's name may have been updated, make sure that this is reflected in any
        // subsequent page loads by clearing the page title cache.
        clearPageMetadataCache('user');

        return { success: true, refresh: true };
    });
}

/**
 * Data associated with an account settings update.
 */
const kAccountSettingsData = z.object({
    /**
     * Example messages that are used to personalise generated AI responses.
     */
    exampleMessages: z.array(z.string().nullish()),
});

/**
 * Server Action called when the account settings are being updated.
 */
export async function updateAccountSettings(userId: number, formData: unknown) {
    'use server';
    return executeServerAction(formData, kAccountSettingsData, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: {
                permission: 'organisation.accounts',
                operation: 'update',
            },
        });

        // Write the example messages to the database. The filter operation ensures that only string
        // values remain, but TypeScript is not yet smart enough to detect this.
        await setExampleMessagesForUser(userId, data.exampleMessages.filter(Boolean) as string[]);

        return { success: true };
    });
}

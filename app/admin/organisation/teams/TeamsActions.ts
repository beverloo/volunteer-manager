// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { RecordLog, kLogType } from '@lib/Log';
import { executeServerAction } from '@lib/serverAction';
import { clearEnvironmentCache } from '@lib/Environment';
import { clearPageMetadataCache } from '@app/admin/lib/generatePageMetadata';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEnvironments } from '@lib/database';

import { kEnvironmentPurpose } from '@lib/database/Types';

/**
 * Zod type that describes information required in order to update an environment.
 */
const kUpdateEnvironmentData = z.object({
    colorDarkMode: z.string().regex(/^#([0-9a-f]){6}$/i),
    colorLightMode: z.string().regex(/^#([0-9a-f]){6}$/i),
    description: z.string().nonempty(),
    // domain is deliberately omitted
    purpose: z.nativeEnum(kEnvironmentPurpose),
    title: z.string().nonempty(),
});

/**
 * Server action that updates environment information for the one identified by the given `userId`.
 */
export async function updateEnvironment(environmentId: number, formData: unknown) {
    'use server';
    return executeServerAction(formData, kUpdateEnvironmentData, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: 'organisation.environments',
        });

        const affectedRows = await db.update(tEnvironments)
            .set({
                environmentColourDarkMode: data.colorDarkMode,
                environmentColourLightMode: data.colorLightMode,
                environmentDescription: data.description,
                environmentPurpose: data.purpose,
                environmentTitle: data.title,
            })
            .where(tEnvironments.environmentId.equals(environmentId))
            .executeUpdate();

        if (!affectedRows)
            return { success: false, error: 'Unable to update the environment in the database…' };

        RecordLog({
            type: kLogType.AdminUpdateEnvironment,
            sourceUser: props.user,
            data: {
                environmentId,
            },
        });

        clearEnvironmentCache();
        clearPageMetadataCache('environment');

        return { success: true, refresh: true };
    });
};

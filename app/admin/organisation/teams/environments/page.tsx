// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { EnvironmentsDataTable } from './EnvironmentsDataTable';
import { createGenerateMetadataFn } from '@app/admin/lib/generatePageMetadata';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEnvironments, tTeams } from '@lib/database';

/**
 * The <EnvironmentsPage> component enables the volunteer to adjust the environments that exist on
 * the Volunteer Manager. These are the individual landing pages through which the system can be
 * reached, each having its own lightweight personalisation.
 */
export default async function EnvironmentsPage() {
    await requireAuthenticationContext({
        check: 'admin',
        permission: 'organisation.environments',
    });

    const dbInstance = db;
    const environments = await db.selectFrom(tEnvironments)
        .innerJoin(tTeams)
            .on(tTeams.teamEnvironmentId.equals(tEnvironments.environmentId))
        .select({
            id: tEnvironments.environmentId,

            domain: tEnvironments.environmentDomain,
            title: tEnvironments.environmentTitle,
            purpose: tEnvironments.environmentPurpose,

            teams: dbInstance.aggregateAsArray({
                name: tTeams.teamName,
                color: tTeams.teamColourLightTheme,
            }),
        })
        .groupBy(tEnvironments.environmentId)
        .orderBy(tEnvironments.environmentDomain, 'asc')
        .executeSelectMany();

    return <EnvironmentsDataTable environments={environments} />;
}

export const generateMetadata = createGenerateMetadataFn('Environments', 'Organisation');

// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import { EnvironmentSection } from './EnvironmentSection';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEnvironments, tTeams } from '@lib/database';

/**
 * The <EnvironmentsPage> component displays an overview of the environments that exist for the
 * AnimeCon volunteer manager. They can be updated, but cannot be created or deleted from this
 * interface as additional server-side configuration is necessary to set up the new domains.
 */
export default async function EnvironmentsPage() {
    await requireAuthenticationContext({
        check: 'admin',
        permission: 'system.internals',
    });

    const teamsJoin = tTeams.forUseInLeftJoin();

    const dbInstance = db;
    const environments = await dbInstance.selectFrom(tEnvironments)
        .leftJoin(teamsJoin)
            .on(teamsJoin.teamEnvironmentId.equals(tEnvironments.environmentId))
        .select({
            id: tEnvironments.environmentId,
            colours: {
                dark: tEnvironments.environmentColourDarkMode,
                light: tEnvironments.environmentColourLightMode,
            },
            description: tEnvironments.environmentDescription,
            domain: tEnvironments.environmentDomain,
            purpose: tEnvironments.environmentPurpose,
            title: tEnvironments.environmentTitle,
            teams: dbInstance.aggregateAsArray({
                name: teamsJoin.teamName,
                slug: teamsJoin.teamSlug,
            }),
        })
        .groupBy(tEnvironments.environmentId)
        .orderBy('domain', 'asc')
        .executeSelectMany();

    return (
        <>
            <Section title="Environments">
                <SectionIntroduction>
                    The AnimeCon Volunteer Manager supports multiple <strong>environments</strong>,
                    each represented by its own domain name. Each environment has its own
                    appearance and can host any number of teams. New environments can be introduced
                    to the system by creating a new row in the "<em>environments</em>" database
                    table.
                </SectionIntroduction>
                { /* TODO: Configure the environment that hosts the admin panel */ }
            </Section>
            { environments.map(environment =>
                <EnvironmentSection key={environment.id} {...environment} /> )}
        </>
    );
}

export const metadata: Metadata = {
    title: 'Environments | AnimeCon Volunteer Manager',
};

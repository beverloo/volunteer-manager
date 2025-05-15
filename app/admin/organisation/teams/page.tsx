// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { forbidden, redirect } from 'next/navigation';

import { TeamsDataTable } from './TeamsDataTable';
import { createGenerateMetadataFn } from '@app/admin/lib/generatePageMetadata';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEnvironments, tTeams } from '@lib/database';

/**
 * The <TeamsPage> component enables the volunteer to list and alter the teams that exist on the
 * Volunteer Manager. Teams are highly configurable entities and can either be managed separately,
 * or jointly together with one or more other teams.
 */
export default async function TeamsPage() {
    const { access } = await requireAuthenticationContext({ check: 'admin' });
    if (!access.can('organisation.teams')) {
        if (access.can('organisation.environments'))
            redirect('/admin/organisation/teams/environments');

        if (access.can('organisation.roles'))
            redirect('/admin/organisation/teams/roles');

        forbidden();
    }

    const teams = await db.selectFrom(tTeams)
        .innerJoin(tEnvironments)
            .on(tEnvironments.environmentId.equals(tTeams.teamEnvironmentId))
        .select({
            id: tTeams.teamId,
            slug: tTeams.teamSlug,

            title: tTeams.teamTitle,

            name: tTeams.teamName,
            colour: tTeams.teamColourLightTheme,

            domain: tEnvironments.environmentDomain,
        })
        .executeSelectMany();

    // TODO: Interface that allows new teams to be created?
    return <TeamsDataTable teams={teams} />;
}

export const generateMetadata = createGenerateMetadataFn('Teams', 'Organisation');

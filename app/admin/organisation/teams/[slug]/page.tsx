// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import { CheckboxElement, SelectElement, TextareaAutosizeElement, TextFieldElement }
    from '@components/proxy/react-hook-form-mui';

import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';

import type { NextPageParams } from '@lib/NextRouterParams';
import { BackButtonGrid } from '@app/admin/components/BackButtonGrid';
import { ColorInput } from '@app/admin/components/ColorInput';
import { FormGrid } from '@app/admin/components/FormGrid';
import { createGenerateMetadataFn } from '@app/admin/lib/generatePageMetadata';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEnvironments, tTeams } from '@lib/database';

import * as actions from '../TeamsActions';

/**
 * The <TeamPage> component shows to the volunteer information about one very specific team, as has
 * been indicated in the URL's parameters. The team's settings can be updated from here too.
 */
export default async function TeamPage(props: NextPageParams<'slug'>) {
    await requireAuthenticationContext({
        check: 'admin',
        permission: 'organisation.teams',
    });

    const params = await props.params;
    const team = await db.selectFrom(tTeams)
        .where(tTeams.teamSlug.equals(params.slug))
        .select({
            id: tTeams.teamId,
            colorDarkMode: tTeams.teamColourDarkTheme,
            colorLightMode: tTeams.teamColourLightTheme,
            description: tTeams.teamDescription,
            environment: tTeams.teamEnvironmentId,
            name: tTeams.teamName,
            plural: tTeams.teamPlural,
            slug: tTeams.teamSlug,
            title: tTeams.teamTitle,

            managesFaq: tTeams.teamManagesFaq.equals(/* true= */ 1),
            managesFirstAid: tTeams.teamManagesFirstAid.equals(/* true= */ 1),
            managesSecurity: tTeams.teamManagesSecurity.equals(/* true= */ 1),
            requestConfirmation: tTeams.teamRequestConfirmation.equals(/* true= */ 1),
        })
        .executeSelectNoneOrOne();

    if (!team)
        notFound();

    const environments = await db.selectFrom(tEnvironments)
        .where(tEnvironments.environmentDeleted.isNull())
            .and(tEnvironments.environmentDeleted.isNull())
        .select({
            id: tEnvironments.environmentId,
            label: tEnvironments.environmentTitle
                .concat(' (')
                .concat(tEnvironments.environmentDomain)
                .concat(')'),
        })
        .orderBy(tEnvironments.environmentTitle, 'asc')
        .executeSelectMany();

    const readOnly = false;  // should we support this?
    const updateTeamFn = actions.updateTeam.bind(null, team.id);

    return (
        <FormGrid action={updateTeamFn} defaultValues={team}>

            <BackButtonGrid href="/admin/organisation/teams">
                Back to teams
            </BackButtonGrid>

            <Grid size={{ xs: 12, md: 6 }}>
                <TextFieldElement name="slug" label="Slug" fullWidth size="small" required
                                  slotProps={{ input: { readOnly: true } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <SelectElement name="environment" label="Environment" fullWidth size="small"
                               required options={environments}
                               slotProps={{ select: { readOnly: !!readOnly } }} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
                <TextFieldElement name="title" label="Team title" fullWidth size="small" required
                                  slotProps={{ input: { readOnly: !!readOnly } }} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
                <TextFieldElement name="name" label="Team name" fullWidth size="small" required
                                  slotProps={{ input: { readOnly: !!readOnly } }} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
                <TextFieldElement name="plural" label="Team plural" fullWidth size="small" required
                                  slotProps={{ input: { readOnly: !!readOnly } }} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
                <ColorInput name="colorDarkMode" label="Theme (Dark Mode)" fullWidth
                            size="small" required />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <ColorInput name="colorLightMode" label="Theme (Light Mode)" fullWidth size="small"
                            required />
            </Grid>

            <Grid size={{ xs: 12 }}>
                <TextareaAutosizeElement name="description" label="Description" fullWidth
                                         size="small" required
                                         slotProps={{ input: { readOnly: !!readOnly } }} />
            </Grid>

            <Grid size={{ xs: 12 }}>
                <Divider />
            </Grid>

            <Grid size={{ xs: 12 }} sx={{ my: -1 }}>
                <CheckboxElement name="managesFirstAid" label="Manages the First Aid team"
                                 size="small" />
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ my: -1 }}>
                <CheckboxElement name="managesFaq" label="Manages the Knowledge Base"
                                 size="small" />
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ my: -1 }}>
                <CheckboxElement name="managesSecurity" label="Manages the Security team"
                                 size="small" />
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ my: -1 }}>
                <CheckboxElement
                    name="requestConfirmation" size="small"
                    label="Request for confirmation in the application approve message?" />
            </Grid>

        </FormGrid>
    );
}

export const generateMetadata = createGenerateMetadataFn({ team: 'slug' }, 'Teams', 'Organisation');

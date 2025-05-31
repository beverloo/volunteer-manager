// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import { CheckboxElement, SelectElement, TextareaAutosizeElement, TextFieldElement }
    from '@components/proxy/react-hook-form-mui';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

import type { NextPageParams } from '@lib/NextRouterParams';
import { BackButtonGrid } from '@app/admin/components/BackButtonGrid';
import { ColorInput } from '@app/admin/components/ColorInput';
import { ConfirmationButton } from '@app/admin/components/ConfirmationButton';
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
    const { access } = await requireAuthenticationContext({
        check: 'admin',
        permission: 'organisation.teams',
    });

    const canDisableTeam = access.can('root');  // only root can disabl teams

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

            flagManagesContent: tTeams.teamFlagManagesContent.equals(/* true= */ 1),
            flagManagesFaq: tTeams.teamFlagManagesFaq.equals(/* true= */ 1),
            flagManagesFirstAid: tTeams.teamFlagManagesFirstAid.equals(/* true= */ 1),
            flagManagesSecurity: tTeams.teamFlagManagesSecurity.equals(/* true= */ 1),
            flagRequestConfirmation: tTeams.teamFlagRequestConfirmation.equals(/* true= */ 1),

            enabled: tTeams.teamDeleted.isNull(),
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

    const backButtonSize = canDisableTeam ? 6 : 12;

    const disableTeamFn = actions.toggleTeamEnabled.bind(null, team.id, /* enabled= */ false);
    const enableTeamFn = actions.toggleTeamEnabled.bind(null, team.id, /* enabled= */ true);
    const updateTeamFn = actions.updateTeam.bind(null, team.id);

    return (
        <FormGrid action={updateTeamFn} defaultValues={team}>

            <BackButtonGrid href="/admin/organisation/structure" size={backButtonSize}>
                Back to teams
            </BackButtonGrid>
            { (canDisableTeam && !!team.enabled) &&
                <Grid size={{ xs: 6 }}>
                    <ConfirmationButton callToAction="Disable" action={disableTeamFn}
                                        icon={ <RemoveCircleOutlineIcon /> }
                                        label="Disable this team…">
                        Are you sure you want to disable the <strong>{team.name}</strong> team? This
                        will stop the team from being considered for any future events, but won't
                        remove any data.
                    </ConfirmationButton>
                </Grid> }
            { (canDisableTeam && !team.enabled) &&
                <Grid size={{ xs: 6 }}>
                    <ConfirmationButton callToAction="Enable" action={enableTeamFn} color="success"
                                        icon={ <AddCircleOutlineIcon /> }
                                        label="Enable this team…">
                        Are you sure you want to enable the <strong>{team.name}</strong> team? This
                        means that they can be considered for future events again.
                    </ConfirmationButton>
                </Grid> }

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
                <CheckboxElement name="flagManagesContent" label="Manages landing page content"
                                 size="small" />
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ my: -1 }}>
                <CheckboxElement name="flagManagesFirstAid" label="Manages the First Aid team"
                                 size="small" />
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ my: -1 }}>
                <CheckboxElement name="flagManagesFaq" label="Manages the Knowledge Base"
                                 size="small" />
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ my: -1 }}>
                <CheckboxElement name="flagManagesSecurity" label="Manages the Security team"
                                 size="small" />
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ my: -1 }}>
                <CheckboxElement
                    name="flagRequestConfirmation" size="small"
                    label="Request for confirmation in the application approve message?" />
            </Grid>

        </FormGrid>
    );
}

export const generateMetadata = createGenerateMetadataFn({ team: 'slug' }, 'Teams', 'Organisation');

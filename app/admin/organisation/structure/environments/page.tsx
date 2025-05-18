// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { TextFieldElement } from '@components/proxy/react-hook-form-mui';

import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { EnvironmentsDataTable } from './EnvironmentsDataTable';
import { FormGrid } from '@app/admin/components/FormGrid';
import { createGenerateMetadataFn } from '@app/admin/lib/generatePageMetadata';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEnvironments, tTeams } from '@lib/database';

import * as actions from '../TeamsActions';

/**
 * The <EnvironmentsPage> component enables the volunteer to adjust the environments that exist on
 * the Volunteer Manager. These are the individual landing pages through which the system can be
 * reached, each having its own lightweight personalisation.
 */
export default async function EnvironmentsPage() {
    const { access } = await requireAuthenticationContext({
        check: 'admin',
        permission: 'organisation.environments',
    });

    const canCreateEnvironments = access.can('root');  // only root can create new environments

    const dbInstance = db;

    const teamsJoin = tTeams.forUseInLeftJoin();

    const environments = await db.selectFrom(tEnvironments)
        .leftJoin(teamsJoin)
            .on(teamsJoin.teamEnvironmentId.equals(tEnvironments.environmentId))
        .where(tEnvironments.environmentDeleted.isNull())
        .select({
            id: tEnvironments.environmentId,

            domain: tEnvironments.environmentDomain,
            title: tEnvironments.environmentTitle,
            purpose: tEnvironments.environmentPurpose,

            teams: dbInstance.aggregateAsArray({
                name: teamsJoin.teamName,
                color: teamsJoin.teamColourLightTheme,
            }),
        })
        .groupBy(tEnvironments.environmentId)
        .orderBy(tEnvironments.environmentDomain, 'asc')
        .executeSelectMany();

    return (
        <>
            <EnvironmentsDataTable environments={environments} />
            { canCreateEnvironments &&
                <>
                    <Divider sx={{ mt: 2, mb: 1 }} />
                    <FormGrid action={actions.createEnvironment} callToAction="Create">
                        <Grid size={{ xs: 12 }} sx={{ mb: -1 }}>
                            <Typography variant="h6">
                                Create a new environment
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextFieldElement name="domain" label="Domain" fullWidth size="small"
                                              required />
                        </Grid>
                    </FormGrid>
                </> }
        </>
    );
}

export const generateMetadata = createGenerateMetadataFn('Environments', 'Organisation');

// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import { SelectElement, TextareaAutosizeElement, TextFieldElement } from '@components/proxy/react-hook-form-mui';

import Grid from '@mui/material/Grid';

import type { EnvironmentPurpose } from '@lib/database/Types';
import type { NextPageParams } from '@lib/NextRouterParams';
import { BackButtonGrid } from '@app/admin/components/BackButtonGrid';
import { ColorInput } from '@app/admin/components/ColorInput';
import { DeleteConfirmationButton } from '@app/admin/components/DeleteConfirmationButton';
import { FormGrid } from '@app/admin/components/FormGrid';
import { createGenerateMetadataFn } from '@app/admin/lib/generatePageMetadata';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEnvironments } from '@lib/database';

import * as actions from '../../TeamsActions';

/**
 * Options for the purpose of an environment that can be selected.
 */
const kEnvironmentPurposeOptions: { [key in EnvironmentPurpose]: string } = {
    LandingPage: 'Landing page',
    Placeholder: 'Placeholder',
};

/**
 * The <EnvironmentPage> component shows to the volunteer information about a specific environment
 * they would like to inspect or update.
 */
export default async function EnvironmentPage(props: NextPageParams<'domain'>) {
    const { access } = await requireAuthenticationContext({
        check: 'admin',
        permission: 'organisation.environments',
    });

    const canDeleteEnvironment = access.can('root');  // only root can delete environments

    const params = await props.params;
    const environment = await db.selectFrom(tEnvironments)
        .where(tEnvironments.environmentDomain.equals(params.domain))
            .and(tEnvironments.environmentDeleted.isNull())
        .select({
            id: tEnvironments.environmentId,
            colorDarkMode: tEnvironments.environmentColourDarkMode,
            colorLightMode: tEnvironments.environmentColourLightMode,
            description: tEnvironments.environmentDescription,
            domain: tEnvironments.environmentDomain,
            purpose: tEnvironments.environmentPurpose,
            title: tEnvironments.environmentTitle,
        })
        .executeSelectNoneOrOne();

    if (!environment)
        notFound();

    const backButtonSize = canDeleteEnvironment ? 6 : 12;
    const purposeOptions = Object.entries(kEnvironmentPurposeOptions).map(([ k, v ]) => ({
        id: k,
        label: v,
    }));

    const readOnly = false;  // should we support this?

    const deleteEnvironmentFn = actions.deleteEnvironment.bind(null, environment.id);
    const updateEnvironmentFn = actions.updateEnvironment.bind(null, environment.id);

    return (
        <FormGrid action={updateEnvironmentFn} defaultValues={environment}>

            <BackButtonGrid href="/admin/organisation/structure/environments" size={backButtonSize}>
                Back to environments
            </BackButtonGrid>
            { canDeleteEnvironment &&
                <Grid size={{ xs: 6 }}>
                    <DeleteConfirmationButton action={deleteEnvironmentFn}
                                              label="Delete this environment…">
                        Are you sure you want to delete <strong>{environment.domain}</strong>? This
                        action is permanent and cannot be undone. All teams currently linked to this
                        environment will need to be reassigned to a different one.
                    </DeleteConfirmationButton>
                </Grid> }

            <Grid size={{ xs: 12, md: 6 }}>
                <TextFieldElement name="domain" label="Domain" fullWidth size="small" required
                                  slotProps={{ input: { readOnly: true } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <SelectElement name="purpose" label="Purpose" options={purposeOptions} fullWidth
                               size="small" required
                               slotProps={{ select: { readOnly: !!readOnly } }} />
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
                <TextFieldElement name="title" label="Title" fullWidth size="small" required
                                  slotProps={{ input: { readOnly: !!readOnly } }} />
            </Grid>

            <Grid size={{ xs: 12 }}>
                <TextareaAutosizeElement name="description" label="Description" fullWidth
                                         size="small" required
                                         slotProps={{ input: { readOnly: !!readOnly } }} />
            </Grid>

        </FormGrid>
    );
}

export const generateMetadata =
    createGenerateMetadataFn({ environment: 'domain' }, 'Environments', 'Organisation');

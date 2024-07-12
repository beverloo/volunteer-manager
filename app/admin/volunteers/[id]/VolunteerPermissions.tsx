// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import CategoryIcon from '@mui/icons-material/Category';
import Grid from '@mui/material/Unstable_Grid2';

import type { AccessDescriptor } from '@lib/auth/AccessDescriptor';
import { FormGridSection } from '@app/admin/components/FormGridSection';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { VolunteerPermissionsTable, type VolunteerPermissionStatus } from './VolunteerPermissionsTable';
import { executeServerAction } from '@lib/serverAction';

import { kPermissions } from '@lib/auth/Access';

/**
 * Data associated with a volunteer permission update.
 */
const kVolunteerPermissionData = z.object({
    /**
     * Nested object of granted permissions. Cannot be accurately represented by Zod.
     * @example { event: { visible: true }, test: {} }
     */
    granted: z.any(),

    /**
     * Nested object of revoked permissions. Cannot be accurately represented by Zod.
     * @example { event: { visible: false }, test: { boolean: true } }
     */
    revoked: z.any(),

    // TODO: events
    // TODO: teams
});

/**
 * Server Action called when the permissions are being updated.
 */
async function updateVolunteerPermissions(userId: number, formData: unknown) {
    'use server';
    return executeServerAction(formData, kVolunteerPermissionData, async (data, props) => {
        console.log(data);
        return { success: false, error: 'Not yet implemented' };
    });
}

/**
 * Props accepted by the <VolunteerPermissions> component.
 */
interface VolunteerPermissionsProps {
    /**
     * Unique ID of the user for whom permissions are being shown.
     */
    userId: number;
}

/**
 * The <VolunteerPermissions> component displays the permissions that have been granted to the given
 * volunteer, as indicated in the `props`. The settings can be updated in real time.
 */
export function VolunteerPermissions(props: VolunteerPermissionsProps) {
    const action = updateVolunteerPermissions.bind(null, props.userId);

    const permissions: VolunteerPermissionStatus[] = [ /* empty */ ];
    for (const [ name, rawDescriptor ] of Object.entries(kPermissions)) {
        const descriptor = rawDescriptor as AccessDescriptor;
        if (!!descriptor.hidden)
            continue;

        permissions.push({
            id: name,
            name: descriptor.name,
            description: descriptor.description,
            warning: !!descriptor.warning,
        });
    }

    return (
        <FormGridSection action={action} icon={ <CategoryIcon color="primary" /> }
                         title="Permissions">
            <Grid xs={12}>
                <SectionIntroduction important>
                    Granting permissions to a volunteer gives them more access within the Volunteer
                    Manager. While you can also revoke permissions, it's usually best to keep that
                    to a minimum.
                </SectionIntroduction>
            </Grid>
            <Grid xs={12}>
                <VolunteerPermissionsTable permissions={permissions} />
            </Grid>
        </FormGridSection>
    );
}

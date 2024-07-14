// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import CategoryIcon from '@mui/icons-material/Category';
import Grid from '@mui/material/Unstable_Grid2';

import type { AccessDescriptor } from '@lib/auth/AccessDescriptor';
import { AccessControl, kAnyEvent, kAnyTeam, type Operation } from '@lib/auth/AccessControl';
import { FormGridSection } from '@app/admin/components/FormGridSection';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { VolunteerPermissionsTable, type VolunteerPermissionStatus } from './VolunteerPermissionsTable';
import { executeServerAction } from '@lib/serverAction';
import db, { tEvents, tTeams, tUsers } from '@lib/database';

import { kPermissions, type BooleanPermission, type CRUDPermission } from '@lib/auth/Access';

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
 * Helper function that lowercases the first letter of the given `text`.
 */
function lowercaseFirst(text: string): string {
    return text.charAt(0).toLowerCase() + text.slice(1);
}

/**
 * Helper function that capitalises the first letter of the given `text`.
 */
function uppercaseFirst(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
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
export async function VolunteerPermissions(props: VolunteerPermissionsProps) {
    const action = updateVolunteerPermissions.bind(null, props.userId);

    const defaultValues: Record<string, any> = { /* empty */ };

    // ---------------------------------------------------------------------------------------------

    const events = await db.selectFrom(tEvents)
        .selectOneColumn(tEvents.eventSlug)
        .executeSelectMany();

    const teams = await db.selectFrom(tTeams)
        .selectOneColumn(tTeams.teamSlug)
        .executeSelectMany();

    const userConfiguration = await db.selectFrom(tUsers)
        .where(tUsers.userId.equals(props.userId))
        .select({
            grants: tUsers.permissionsGrants,
            revokes: tUsers.permissionsRevokes,
            events: tUsers.permissionsEvents,
            teams: tUsers.permissionsTeams,
        })
        .executeSelectOne();

    const userAccessControl = new AccessControl(userConfiguration);
    // TODO: Have a second `AccessControl` instance w/ implicitly granted rights

    // ---------------------------------------------------------------------------------------------

    const defaultOptions = {
        event: kAnyEvent,
        team: kAnyTeam,
    };

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

        if (descriptor.type === 'boolean') {
            const booleanPermission = name as BooleanPermission;
            switch (userAccessControl.getStatus(booleanPermission, defaultOptions)) {
                case 'self-granted':
                    defaultValues[`granted[${name}]`] = true;
                    break;

                case 'self-revoked':
                    defaultValues[`revoked[${name}]`] = true;
                    break;
            }
        } else if (descriptor.type === 'crud') {
            const crudPermission = name as CRUDPermission;
            for (const rawOperation of [ 'create', 'read', 'update', 'delete' ]) {
                const operation = rawOperation as Operation;

                permissions.push({
                    id: `${name}.${operation}`,
                    name: `${uppercaseFirst(operation)} ${lowercaseFirst(descriptor.name)}`,
                });

                switch (userAccessControl.getStatus(crudPermission, operation, defaultOptions)) {
                    case 'crud-granted':
                        defaultValues[`granted[${name}.${operation}]`] = true;
                        break;

                    case 'crud-revoked':
                        defaultValues[`revoked[${name}.${operation}]`] = true;
                        break;

                    case 'self-granted':
                        defaultValues[`granted[${name}]`] = true;
                        break;

                    case 'self-revoked':
                        defaultValues[`revoked[${name}]`] = true;
                        break
                }
            }
        } else {
            throw new Error(`Unhandled permission type: "${descriptor.type}"`);
        }
    }

    // ---------------------------------------------------------------------------------------------

    return (
        <FormGridSection action={action} defaultValues={defaultValues}
                         icon={ <CategoryIcon color="primary" /> } title="Permissions">
            <Grid xs={12}>
                <SectionIntroduction important>
                    Granting permissions to a volunteer gives them more access within the Volunteer
                    Manager. While you can also revoke permissions, it's usually best to keep that
                    to a minimum.
                </SectionIntroduction>
            </Grid>
            { /* TODO: Multi-select for events */ }
            { /* TODO: Multi-select for teams */ }
            <Grid xs={12}>
                <VolunteerPermissionsTable permissions={permissions} />
            </Grid>
        </FormGridSection>
    );
}

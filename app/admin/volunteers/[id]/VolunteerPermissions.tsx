// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import Alert from '@mui/material/Alert';
import CategoryIcon from '@mui/icons-material/Category';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import type { AccessDescriptor } from '@lib/auth/AccessDescriptor';
import { AccessControl, kAnyEvent, kAnyTeam, type Operation } from '@lib/auth/AccessControl';
import { FormGridSection } from '@app/admin/components/FormGridSection';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { VolunteerPermissionsTable, type VolunteerPermissionStatus } from './VolunteerPermissionsTable';
import { executeServerAction } from '@lib/serverAction';
import db, { tEvents, tRoles, tTeams, tUsers, tUsersEvents } from '@lib/database';

import { kPermissions, type BooleanPermission, type CRUDPermission } from '@lib/auth/Access';
import { RegistrationStatus } from '@lib/database/Types';

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
        if (!props.access.can('volunteer.permissions', 'update'))
            return { success: false, error: 'You are not able to update permissions' };

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
     * Whether the permissions should be displayed as read-only.
     */
    readOnly?: boolean;

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

    const dbInstance = db;
    const defaultValues: Record<string, any> = { /* empty */ };

    // ---------------------------------------------------------------------------------------------

    const events = await dbInstance.selectFrom(tEvents)
        .selectOneColumn(tEvents.eventSlug)
        .executeSelectMany();

    const teams = await dbInstance.selectFrom(tTeams)
        .selectOneColumn(tTeams.teamSlug)
        .executeSelectMany();

    const eventsJoin = tEvents.forUseInLeftJoin();
    const rolesJoin = tRoles.forUseInLeftJoin();
    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();

    const userConfiguration = await dbInstance.selectFrom(tUsers)
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.userId.equals(tUsers.userId))
                .and(usersEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted))
        .leftJoin(eventsJoin)
            .on(eventsJoin.eventId.equals(usersEventsJoin.eventId))
                .and(eventsJoin.eventHidden.equals(/* false= */ 0))
        .leftJoin(rolesJoin)
            .on(rolesJoin.roleId.equals(usersEventsJoin.roleId))
        .where(tUsers.userId.equals(props.userId))
            .and(eventsJoin.eventId.isNotNull())
        .select({
            access: {
                grants: tUsers.permissionsGrants,
                revokes: tUsers.permissionsRevokes,
                events: tUsers.permissionsEvents,
                teams: tUsers.permissionsTeams,
            },
            events: dbInstance.aggregateAsArray({
                event: eventsJoin.eventSlug,
                grant: rolesJoin.rolePermissionGrant,
                label: eventsJoin.eventShortName,
            }),
        })
        .groupBy(tUsers.userId)
        .executeSelectNoneOrOne();

    const userAccessControl = new AccessControl(userConfiguration?.access ?? { /* no grants */ });
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

            <Grid xs={3}>
                <Typography variant="body2">
                    Explicit event access:
                </Typography>
            </Grid>
            <Grid xs={9}>
                ...
            </Grid>

            <Grid xs={3}>
                <Typography variant="body2">
                    Explicit team access:
                </Typography>
            </Grid>
            <Grid xs={9}>
                ...
            </Grid>

            <Grid xs={12}>
                <VolunteerPermissionsTable permissions={permissions} readOnly={props.readOnly} />
            </Grid>

            { !!userConfiguration?.events.length &&
                <>
                    <Grid xs={12}>
                        <Divider />
                    </Grid>
                    <Grid xs={12}>
                        <Alert variant="outlined" severity="info">
                            Additional role-based access has been granted based on their
                            participation in{' '}
                            {userConfiguration.events.map(({ label }) => label ).sort().join(', ')}.
                        </Alert>
                    </Grid>
                </> }

        </FormGridSection>
    );
}

// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { SelectElement } from '@components/proxy/react-hook-form-mui';

import Alert from '@mui/material/Alert';
import CategoryIcon from '@mui/icons-material/Category';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import type { AccessDescriptor, AccessOperation } from '@lib/auth/AccessDescriptor';
import { AccessControl, kAnyEvent, kAnyTeam, type AccessGrants } from '@lib/auth/AccessControl';
import { FormGridSection } from '@app/admin/components/FormGridSection';
import { RegistrationStatus } from '@lib/database/Types';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { VolunteerPermissionsTable, type ComprehensivePermissionStatus, type VolunteerPermissionStatus } from './VolunteerPermissionsTable';
import { executeServerAction } from '@lib/serverAction';
import db, { tEvents, tRoles, tTeams, tUsers, tUsersEvents } from '@lib/database';

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

    /**
     * Events that the account has been explicitly granted access to.
     * @example [ "2024", "2025" ]
     */
    events: z.array(z.string()),

    /**
     * Teams that the account has been explicitly granted access to.
     * @example [ "crew", "hosts" ]
     */
    teams: z.array(z.string()),
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
 * Decides whether the 'current' should be upgraded into the `incoming` permission status. This is
 * only the case when the `incoming` status is less specific than the given `current` status.
 */
function maybeUpgradePermissionStatus(
    current: ComprehensivePermissionStatus, incoming: ComprehensivePermissionStatus)
        : ComprehensivePermissionStatus
{
    switch (current) {
        case 'unset': {
            switch (incoming) {
                case 'crud-granted':
                    return 'partial-granted';
                case 'crud-revoked':
                    break;  // parent permission wasn't granted, so this is a no-op

                case 'parent-granted':
                case 'parent-revoked':
                    return incoming;
            }
            break;
        }

        case 'parent-granted':
        case 'self-granted': {
            switch (incoming) {
                case 'crud-revoked':
                    return 'partial-granted';
            }
            break;
        }

        case 'parent-revoked':
        case 'self-revoked': {
            switch (incoming) {
                case 'crud-granted':
                    return 'partial-granted';
            }
            break;
        }
    }

    return current;
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
    const defaultValues: Record<string, any> = {
        events: [ /* todo */ ],
        teams: [ /* todo */ ],
    };

    // ---------------------------------------------------------------------------------------------

    const events = await dbInstance.selectFrom(tEvents)
        .select({
            id: tEvents.eventSlug,
            label: tEvents.eventSlug,
        })
        .orderBy(tEvents.eventStartTime, 'desc')
        .executeSelectMany();

    const eventsOptions = [
        { id: kAnyEvent, label: 'All events' },
        ...events,
    ];

    const teams = await dbInstance.selectFrom(tTeams)
        .select({
            id: tTeams.teamSlug,
            label: tTeams.teamName,
        })
        .orderBy(tTeams.teamName, 'asc')
        .executeSelectMany();

    const teamsOptions = [
        { id: kAnyTeam, label: 'All teams' },
        ...teams,
    ];

    // ---------------------------------------------------------------------------------------------

    const eventsJoin = tEvents.forUseInLeftJoin();
    const rolesJoin = tRoles.forUseInLeftJoin();
    const teamsJoin = tTeams.forUseInLeftJoin();
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
        .leftJoin(teamsJoin)
            .on(teamsJoin.teamId.equals(usersEventsJoin.teamId))
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
                team: teamsJoin.teamSlug,
            }),
        })
        .groupBy(tUsers.userId)
        .executeSelectNoneOrOne();

    const userAccessControl = new AccessControl(userConfiguration?.access ?? { /* no grants */ });

    const roleGrants: AccessGrants = { grants: [], revokes: [] };
    if (!!userConfiguration) {
        for (const { event, grant, team } of userConfiguration?.events) {
            if (!grant || !Array.isArray(roleGrants.grants))
                continue;  // no grants are part of this participation

            roleGrants.grants.push({
                permission: grant,
                event,
                team,
            });
        }
    }

    const roleAccessControl = new AccessControl(roleGrants);

    // ---------------------------------------------------------------------------------------------

    if (userConfiguration?.access?.events)
        defaultValues['events'] = userConfiguration.access.events.split(',');

    if (userConfiguration?.access?.teams)
        defaultValues['teams'] = userConfiguration.access.teams.split(',');

    // ---------------------------------------------------------------------------------------------

    const defaultOptions = {
        event: kAnyEvent,
        team: kAnyTeam,
    };

    const permissions: VolunteerPermissionStatus[] = [ /* empty */ ];
    for (const [ name, rawDescriptor ] of Object.entries(kPermissions)) {
        const descriptor = rawDescriptor as AccessDescriptor;
        if (!!descriptor.hidden)
            continue;  // this permission has been explicitly hidden

        const permissionChildren: VolunteerPermissionStatus[] = [];
        const permission: VolunteerPermissionStatus = {
            id: name,
            name: descriptor.name,
            description: descriptor.description,
            status: {
                account: 'unset',
                roles: 'unset',
            },
            warning: !!descriptor.warning,
        };

        if (descriptor.type === 'boolean') {
            const booleanPermission = name as BooleanPermission;

            permission.status.account =
                userAccessControl.getStatus(booleanPermission, defaultOptions);
            permission.status.roles =
                roleAccessControl.getStatus(booleanPermission, defaultOptions);

            switch (permission.status.account) {
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
                const operation = rawOperation as AccessOperation;

                if (!!descriptor.hide && descriptor.hide.includes(operation))
                    continue;  // this operation has been explicitly hidden

                const childPermission: VolunteerPermissionStatus = {
                    id: `${name}.${operation}`,
                    name: `${uppercaseFirst(operation)} ${lowercaseFirst(descriptor.name)}`,
                    status: {
                        account:
                            userAccessControl.getStatus(crudPermission, operation, defaultOptions),
                        roles:
                            roleAccessControl.getStatus(crudPermission, operation, defaultOptions),
                    },
                };

                permission.status.account = maybeUpgradePermissionStatus(
                    permission.status.account, childPermission.status.account);

                permission.status.roles = maybeUpgradePermissionStatus(
                    permission.status.roles, childPermission.status.roles);

                switch (childPermission.status.account) {
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
                        break;
                }

                permissionChildren.push(childPermission);
            }
        } else {
            throw new Error(`Unhandled permission type: "${descriptor.type}"`);
        }

        permissions.push(permission, ...permissionChildren);
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

            <Grid xs={2}>
                <Typography variant="body2" sx={{ pt: 1.25 }}>
                    Explicit event access:
                </Typography>
            </Grid>
            <Grid xs={10}>
                <SelectElement name="events" label="Event access" SelectProps={{ multiple: true }}
                               options={eventsOptions} size="small" fullWidth
                               disabled={props.readOnly} />
            </Grid>

            <Grid xs={2}>
                <Typography variant="body2" sx={{ pt: 1.25 }}>
                    Explicit team access:
                </Typography>
            </Grid>
            <Grid xs={10}>
                <SelectElement name="teams" label="Team access" SelectProps={{ multiple: true }}
                               options={teamsOptions} size="small" fullWidth
                               disabled={props.readOnly} />
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

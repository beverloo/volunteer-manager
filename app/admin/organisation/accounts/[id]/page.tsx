// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import Divider from '@mui/material/Divider';

import type { NextPageParams } from '@lib/NextRouterParams';
import { AccountInformation } from './AccountInformation';
import { FormGrid } from '@app/admin/components/FormGrid';
import { ParticipationTable } from './ParticipationTable';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tEvents, tRoles, tTeams, tUsers, tUsersEvents } from '@lib/database';

import * as actions from './AccountActions';
import { createGenerateMetadataFn } from '@app/admin/lib/generatePageMetadata';
import { AnonymizationButton } from './AnonymizationButton';

/**
 * Displays an account participation table for the user identified by the given `userId`.
 */
async function AccountParticipationTable(props: { userId: number }) {
    const dbInstance = db;
    const participation = await dbInstance.selectFrom(tUsersEvents)
        .innerJoin(tEvents)
            .on(tEvents.eventId.equals(tUsersEvents.eventId))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tUsersEvents.teamId))
        .innerJoin(tRoles)
            .on(tRoles.roleId.equals(tUsersEvents.roleId))
        .where(tUsersEvents.userId.equals(props.userId))
        .select({
            id: tUsersEvents.eventId.multiply(1000).add(tUsersEvents.teamId),
            eventShortName: tEvents.eventShortName,
            eventSlug: tEvents.eventSlug,
            eventStartTime: dbInstance.dateTimeAsString(tEvents.eventStartTime),
            status: tUsersEvents.registrationStatus,
            role: tRoles.roleName,
            team: tTeams.teamName,
            teamSlug: tTeams.teamSlug,
            teamColour: tTeams.teamColourLightTheme,
        })
        .orderBy('eventStartTime', 'desc')
        .executeSelectMany();

    return <ParticipationTable participation={participation} userId={props.userId} />;
}

/**
 * The <AccountInformationPage> component displays the basic account information, together with a
 * series of actions that are available to this account, for example to toggle its availability.
 */
export default async function AccountInformationPage(props: NextPageParams<'id'>) {
    const { access } = await requireAuthenticationContext({
        check: 'admin',
        permission: {
            permission: 'organisation.accounts',
            operation: 'read',
        },
    });

    const userId = parseInt((await props.params).id, /* radix= */ 10);
    if (!Number.isSafeInteger(userId))
        notFound();

    const action = actions.updateAccountInformation.bind(null, userId);

    const dbInstance = db;
    const defaultValues = await dbInstance.selectFrom(tUsers)
        .where(tUsers.userId.equals(userId))
        .select({
            firstName: tUsers.firstName,
            lastName: tUsers.lastName,
            displayName: tUsers.displayName,
            birthdate: dbInstance.dateAsString(tUsers.birthdate),
            gender: tUsers.gender,
            username: tUsers.username,
            phoneNumber: tUsers.phoneNumber,
            discordHandle: tUsers.discordHandle,
            discordHandleUpdated: tUsers.discordHandleUpdated.isNotNull(),
        })
        .executeSelectNoneOrOne();

    if (!defaultValues)
        notFound();

    const anonymizationAction =
        access.can('organisation.accounts', 'delete')
            ? actions.anonymizeAccount.bind(null, userId)
            : undefined;

    const readOnly = !access.can('organisation.accounts', 'update');

    return (
        <>
            <FormGrid action={action} defaultValues={defaultValues}>
                <AccountInformation confirmDiscordFn={ actions.confirmDiscord.bind(null, userId) }
                                    discordHandle={defaultValues.discordHandle}
                                    discordHandleUpdated={defaultValues.discordHandleUpdated}
                                    userId={userId} readOnly={readOnly} />
            </FormGrid>
            <Divider sx={{ my: 2 }} />
            <AccountParticipationTable userId={userId} />
            { !!anonymizationAction &&
                <>
                    <Divider sx={{ my: 2 }} />
                    <AnonymizationButton
                        action={anonymizationAction}
                        name={`${defaultValues.firstName} ${defaultValues.lastName}`} />
                </> }
        </>
    );
}

export const generateMetadata =
    createGenerateMetadataFn({ user: 'id' }, 'Accounts', 'Organisation');

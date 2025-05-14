// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { AccountDataTable } from './AccountDataTable';
import { Section } from '../../components/Section';
import { SectionIntroduction } from '../../components/SectionIntroduction';
import { createGenerateMetadataFn } from '@app/admin/lib/generatePageMetadata';
import { readUserSettings } from '@lib/UserSettings';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tTeams, tUsers, tUsersEvents } from '@lib/database';

import { kRegistrationStatus } from '@lib/database/Types';

/**
 * The <AccountsPage> component lists the accounts known to the Volunteer Manager. Each account can
 * be viewed and adjusted providing the right permissions are available to the signed in user.
 */
export default async function AccountsPage() {
    const { user } = await requireAuthenticationContext({
        check: 'admin',
        permission: {
            permission: 'organisation.accounts',
            operation: 'read',
        },
    });

    const dbInstance = db;

    // ---------------------------------------------------------------------------------------------
    // Volunteer information from the database:
    // ---------------------------------------------------------------------------------------------

    const teamsJoin = tTeams.forUseInLeftJoin();
    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();

    const volunteers = await dbInstance.selectFrom(tUsers)
            .leftJoin(usersEventsJoin)
                .on(usersEventsJoin.userId.equals(tUsers.userId)
                    .and(usersEventsJoin.registrationStatus.equals(kRegistrationStatus.Accepted)))
            .leftJoin(teamsJoin)
                .on(teamsJoin.teamId.equals(usersEventsJoin.teamId))
            .select({
                id: tUsers.userId,
                username: tUsers.username,
                firstName: tUsers.firstName,
                lastName: tUsers.lastName,
                displayName: tUsers.displayName,
                name: tUsers.name,
                gender: tUsers.gender,
                phoneNumber: tUsers.phoneNumber,
                discordHandle: tUsers.discordHandle,
                birthdate: dbInstance.dateAsString(tUsers.birthdate),
                teams: dbInstance.stringConcatDistinct(teamsJoin.teamName),
                activated: tUsers.activated.equals(/* true= */ 1),
            })
            .groupBy(tUsers.userId)
            .orderBy(tUsers.name, 'asc')
            .executeSelectMany();

    // ---------------------------------------------------------------------------------------------
    // Team information from the database:
    // ---------------------------------------------------------------------------------------------

    const teamColours = await dbInstance.selectFrom(tTeams)
            .select({
                name: tTeams.teamName,
                darkThemeColour: tTeams.teamColourDarkTheme,
                lightThemeColour: tTeams.teamColourLightTheme,
            })
            .executeSelectMany();

    // ---------------------------------------------------------------------------------------------
    // Column and filter preferences:
    // ---------------------------------------------------------------------------------------------

    const userSettings = await readUserSettings(user.userId, [
        'user-admin-volunteers-columns-hidden',
        'user-admin-volunteers-columns-filter',
    ]);

    const filterModel = userSettings['user-admin-volunteers-columns-filter'] || undefined;
    const hiddenFields =
        userSettings['user-admin-volunteers-columns-hidden']
            || 'firstName,lastName,displayName,phoneNumber,gender,birthdate,discordHandle';

    return (
        <Section title="Volunteers">
            <SectionIntroduction>
                This table lists all volunteers who helped us out since 2010—not all information
                is complete, and these accounts are separate from the information stored in AnPlan.
                Columns and filtering can be altered through the column menu.
            </SectionIntroduction>
            <AccountDataTable initialFilterModel={filterModel}
                              initialHiddenFields={hiddenFields} teamColours={teamColours}
                              volunteers={volunteers} />
        </Section>
    );
}

export const generateMetadata = createGenerateMetadataFn('Accounts', 'Organisation');

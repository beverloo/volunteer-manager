// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import Link from 'next/link';

import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { ExpandableSection } from '../components/ExpandableSection';
import { RegistrationStatus } from '@lib/database/Types';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { VolunteerDataTable } from './VolunteerDataTable';
import { readUserSettings } from '@lib/UserSettings';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tTeams, tUsers, tUsersEvents } from '@lib/database';

/**
 * Regular expression to verify that phone numbers are stored in a E.164-compatible format.
 */
const kPhoneNumberRegex = /^\+[1-9]\d{1,14}$/;

/**
 * Overview page showing all users who volunteered at at least one of the AnimeCon events, displayed
 * in a Data Table. Provides access to individual user pages.
 */
export default async function VolunteersPage() {
    const { user } = await requireAuthenticationContext({
        check: 'admin',
        permission: {
            permission: 'volunteer.account.information',
            operation: 'read',
        },
    });

    const teamsJoin = tTeams.forUseInLeftJoin();
    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();

    const dbInstance = db;
    const volunteers = await dbInstance.selectFrom(tUsers)
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.userId.equals(tUsers.userId)
                .and(usersEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted)))
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
            birthdate: dbInstance.dateAsString(tUsers.birthdate),
            teams: dbInstance.stringConcatDistinct(teamsJoin.teamName),
            activated: tUsers.activated.equals(/* true= */ 1),
            admin: tUsers.privileges.modulo(2n).equals(/* true= */ 1n),
        })
        .groupBy(tUsers.userId)
        .orderBy(tUsers.lastName, 'asc')
        .orderBy(tUsers.firstName, 'asc')
        .executeSelectMany();

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
            || 'firstName,lastName,displayName,phoneNumber,gender,birthdate';

    // ---------------------------------------------------------------------------------------------
    // Compute account warnings:
    // ---------------------------------------------------------------------------------------------

    type Warning = {
        userId: number;
        name: string;
        text: string;
    };

    const warnings: Warning[] = [];

    for (const volunteer of volunteers) {
        if (!volunteer.activated) {
            warnings.push({
                userId: volunteer.id,
                name: volunteer.name,
                text: 'Their account has not been activated yet.',
            })
        }

        if (!!volunteer.phoneNumber && !kPhoneNumberRegex.test(volunteer.phoneNumber)) {
            warnings.push({
                userId: volunteer.id,
                name: volunteer.name,
                text:
                    `Their phone number (${volunteer.phoneNumber}) should be stored in a ` +
                    'E.164-compatible format.',
            });
        }
    }

    warnings.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));

    const warningLabel = !!warnings.length ? `${warnings.length}` : undefined;
    const warningIcon = !!warnings.length ? <WarningAmberIcon color="warning" />
                                          : <TaskAltIcon color="success" />;

    // ---------------------------------------------------------------------------------------------

    return (
        <>
            <Section title="Volunteers">
                <SectionIntroduction>
                    This table lists all volunteers who helped us out since 2010—not all information
                    is complete. Columns and filtering can be altered through the column menu.
                </SectionIntroduction>
                <VolunteerDataTable initialFilterModel={filterModel}
                                    initialHiddenFields={hiddenFields} teamColours={teamColours}
                                    volunteers={volunteers} />
            </Section>
            <ExpandableSection icon={warningIcon} title="Warnings" subtitle={warningLabel}>
                { !warnings.length &&
                    <SectionIntroduction>
                        We rely on certain information to be stored in a particular format, such as
                        phone numbers. <strong>Right now everything is in order!</strong>
                    </SectionIntroduction> }

                { !!warnings.length &&
                    <SectionIntroduction important>
                        We rely on certain information to be stored in a particular format, such as
                        phone numbers, otherwise some functionality may not work as expected.
                    </SectionIntroduction> }

                <List dense disablePadding>
                    { warnings.map((warning, index) =>
                        <ListItemButton LinkComponent={Link} href={`./volunteers/${warning.userId}`}
                                        key={index}>
                            <ListItemIcon>
                                <WarningAmberIcon color="info" />
                            </ListItemIcon>
                            <ListItemText primary={warning.name}
                                          secondary={warning.text} />
                        </ListItemButton> )}
                </List>
            </ExpandableSection>
        </>
    );
}

export const metadata: Metadata = {
    title: 'Volunteers | AnimeCon Volunteer Manager',
};

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Metadata } from 'next';
import { notFound } from 'next/navigation';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { type ParticipationInfo, Participation } from './Participation';
import { Permissions } from './Permissions';
import { Privilege, can } from '@app/lib/auth/Privileges';
import { UnderConstructionPaper } from '@app/admin/UnderConstructionPaper';
import { requireUser } from '@lib/auth/getUser';
import { sql } from '@lib/database';

/**
 * Information about the volunteer for whom this page is being displayed.
 */
interface VolunteerInfo {
    /**
     * Information about the volunteer's account.
     */
    account: {
        userId: number;
        firstName: string;
        lastName: string;
        privileges: number;
    };

    /**
     * Information about the volunteer's participation across AnimeCon events.
     */
    participation: ParticipationInfo[];
}

/**
 * Fetches information about the volunteer identified by the given `unverifiedId` from the database.
 */
async function fetchVolunteerInfo(unverifiedId: string): Promise<VolunteerInfo | undefined> {
    const [ account, participation ] = await Promise.all([
        // -----------------------------------------------------------------------------------------
        // Account
        // -----------------------------------------------------------------------------------------
        sql`SELECT
                users.user_id AS userId,
                users.first_name AS firstName,
                users.last_name AS lastName,
                privileges
            FROM
                users
            WHERE
                users.user_id = ${unverifiedId}`,

        // -----------------------------------------------------------------------------------------
        // Participation
        // -----------------------------------------------------------------------------------------
        sql`SELECT
                (1000 * users_events.event_id + users_events.team_id) AS id,
                events.event_short_name AS event,
                events.event_slug AS eventSlug,
                users_events.registration_status AS status,
                teams.team_name AS team,
                roles.role_name AS role
            FROM
                users_events
            LEFT JOIN
                events ON events.event_id = users_events.event_id
            LEFT JOIN
                teams ON teams.team_id = users_events.team_id
            LEFT JOIN
                roles ON roles.role_id = users_events.role_id
            WHERE
                users_events.user_id = ${unverifiedId}
            ORDER BY
                events.event_start_time DESC`
    ]);

    if (!account.ok || !account.rows.length)
        notFound();
    if (!participation.ok)
        notFound();

    return {
        account: account.rows[0] as VolunteerInfo['account'],
        participation: participation.rowsPod as ParticipationInfo[],
    };
}

/**
 * Props accepted by the <Header> component.
 */
interface HeaderProps {
    /**
     * Information about the account of the volunteer for whom the header is shown.
     */
    account: VolunteerInfo['account'];
}

/**
 * The <Header> component provides access to the volunteer's primary identity and quick access
 * related to the workings of their account, for example to (de)activate them or request a new
 * passport or access code.
 */
function Header(props: HeaderProps) {
    const { account } = props;

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5">
                {account.firstName} {account.lastName}
            </Typography>
        </Paper>
    );
}

/**
 * Props accepted by the <Information> component.
 */
interface InformationProps {
    // TODO
}

/**
 * The <Information> component lists the volunteer's basic information, which may be amended by the
 * person who has access to this page. Amendments are made using an API call.
 */
function Information(props: InformationProps) {
    return (
        <UnderConstructionPaper>
            Information
        </UnderConstructionPaper>
    );
}

/**
 * Displays information about an individual volunteer, uniquely identified by their ID. Data will
 * be fetched from the database prior to being displayed.
 */
export default async function VolunteerPage(props: NextRouterParams<'id'>) {
    const user = await requireUser();
    if (!can(user, Privilege.AccessVolunteers))
        notFound();

    const volunteerInfo = await fetchVolunteerInfo(props.params.id);
    if (!volunteerInfo)
        notFound();

    const { account, participation } = volunteerInfo;

    return (
        <>
            <Header account={volunteerInfo.account} />
            <Information />
            <Participation participation={participation} userId={account.userId} />

            { can(user, Privilege.Administrator) &&
                <Permissions userId={account.userId} privileges={account.privileges} /> }
        </>
    );
}

/**
 * Dynamically generates metadata for this request by fetching the volunteer's real name from the
 * database, and using this as the page title. MysQL connections are pooled.
 */
export async function generateMetadata(props: NextRouterParams<'id'>): Promise<Metadata> {
    const result = await sql`
        SELECT
            CONCAT(users.first_name, " ", users.last_name) AS name
        FROM
            users
        WHERE
            users.user_id = ${props.params.id}`;

    if (result.ok && result.rows.length >= 1)
        return { title: `${result.rows[0].name} | AnimeCon Volunteer Manager` };

    return { /* no updates */ };
}

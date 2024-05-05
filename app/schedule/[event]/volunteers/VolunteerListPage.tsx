// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { useCallback, useContext, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import AlertTitle from '@mui/material/AlertTitle';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import type { PublicSchedule } from '@app/api/event/schedule/PublicSchedule';
import { Alert } from '../components/Alert';
import { ScheduleContext } from '../ScheduleContext';
import { SetTitle } from '../components/SetTitle';

/**
 * Information that should be known about an individual volunteer.
 */
type VolunteerInfo = PublicSchedule['volunteers'][number];

/**
 * Props accepted by the <VolunteerList> component.
 */
interface VolunteerListProps {
    /**
     * The volunteers who are part of this team.
     */
    volunteers: VolunteerInfo[];
}

/**
 * The <VolunteerList> component displays a list of volunteers, each part of a particular team.
 */
function VolunteerList(props: VolunteerListProps) {
    const { volunteers } = props;

    return (
        <List>
            {volunteers.map(volunteer => {
                const href = `./volunteers/${volunteer.id}`;

                // TODO: Display their avatar (w/ optional badge)
                // TODO: Display their role
                // TODO: Display their current occupation, if any

                return (
                    <ListItemButton LinkComponent={Link} key={volunteer.id} href={href}>
                        {volunteer.name}
                    </ListItemButton>
                );
            } )}
        </List>
    );
}

/**
 * The <VolunteerListPage> page displays a list of all volunteers that have been made available to
 * the signed in volunteer. Tabs will be used when they exist across more than a single team.
 */
export function VolunteerListPage() {
    const { schedule } = useContext(ScheduleContext);
    const router = useRouter();

    const teams = useMemo(() => {
        if (!schedule?.teams || !schedule.volunteers)
            return undefined;

        const teams = new Map<string, VolunteerInfo[]>(
            Object.values(schedule.teams).map(team => ([ team.id, [ /* volunteers */ ] ])));

        for (const volunteer of Object.values(schedule.volunteers)) {
            teams.get(volunteer.team)?.push({
                ...volunteer,
            });
        }

        // TODO: Sort each of the `teams` by availability, then name.

        // Amend the `teams` with information about the team it's representing.
        const unsortedTeams = [ ...teams.entries() ].map(([ teamId, volunteers ]) => ({
            id: teamId,
            label: schedule.teams[teamId].name,
            volunteers,
        }));

        // Sort the teams by their name. This means that the volunteers page always has a
        // predictable list of teams shown.
        return unsortedTeams.sort((lhs, rhs) => lhs.label.localeCompare(rhs.label));

    }, [ schedule?.teams, schedule?.volunteers ]);

    // ---------------------------------------------------------------------------------------------

    let defaultTeam: string | undefined;
    if (!!schedule?.userId && schedule.volunteers.hasOwnProperty(schedule.userId))
        defaultTeam = schedule.volunteers[schedule.userId].team;
    else if (!!teams?.length)
        defaultTeam = teams[0].id;

    const searchParams = useSearchParams();
    const selectedTeam = searchParams.get('team') || defaultTeam;

    const handleTeamChange = useCallback((event: unknown, team: any) => {
        router.push(`./volunteers?team=${team}`);
    }, [ router ]);

    // ---------------------------------------------------------------------------------------------

    if (!teams || !teams.length) {
        return (
            <>
                <SetTitle title="Volunteers" />
                <Alert elevation={1} severity="error">
                    <AlertTitle>No volunteers could be found!</AlertTitle>
                    No volunteers have been assigned to this event yet.
                </Alert>
            </>
        );
    } else if (teams.length === 1) {
        return (
            <>
                <SetTitle title="Volunteers" />
                <Paper>
                    <VolunteerList volunteers={teams[0].volunteers} />
                </Paper>
            </>
        );
    } else {
        return (
            <>
                <SetTitle title="Volunteers" />
                <Paper>
                    <Tabs onChange={handleTeamChange} value={selectedTeam} variant="fullWidth">
                        { teams.map(team =>
                            <Tab key={team.id} value={team.id} label={team.label} /> )}
                    </Tabs>
                    { teams.map(team => {
                        if (team.id !== selectedTeam)
                            return undefined;

                        return <VolunteerList key={team.id} volunteers={team.volunteers} />;
                    } )}
                </Paper>
            </>
        );
    }
}

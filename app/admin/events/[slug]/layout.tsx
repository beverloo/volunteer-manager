// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import FeedOutlinedIcon from '@mui/icons-material/FeedOutlined';
import GridViewIcon from '@mui/icons-material/GridView';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import HotelIcon from '@mui/icons-material/Hotel';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';

import type { User } from '@lib/auth/User';
import { AdminContent } from '../../AdminContent';
import { AdminPageContainer } from '../../AdminPageContainer';
import { type AdminSidebarMenuEntry, AdminSidebar } from '../../AdminSidebar';
import { Privilege } from '@lib/auth/Privileges';
import { RegistrationStatus } from '@lib/database/Types';
import { requireUser } from '@lib/auth/getUser';

import db, { tEvents, tEventsTeams, tTeams, tUsersEvents } from '@lib/database';


/**
 * Fetch the information about the event identified by `eventSlug` that is applicable to the given
 * `user`, with access checks being in place. The menu will be rendered based on this information.
 */
async function fetchEventSidebarInformation(user: User, eventSlug: string) {
    const dbInstance = db;
    const pendingApplicationsJoin = dbInstance.selectFrom(tUsersEvents)
        .where(tUsersEvents.registrationStatus.equals(RegistrationStatus.Registered))
        .select({
            eventId: tUsersEvents.eventId,
            teamId: tUsersEvents.teamId,
            applications: dbInstance.count(tUsersEvents.userId),
        })
        .forUseInQueryAs('PendingApplications')
        .forUseInLeftJoinAs('PendingApplications');

    return await dbInstance.selectFrom(tEvents)
        .innerJoin(tEventsTeams)
            .on(tEventsTeams.eventId.equals(tEvents.eventId))
        .innerJoin(tTeams)
            .on(tTeams.teamId.equals(tEventsTeams.teamId))
        .leftJoin(pendingApplicationsJoin)
            .on(pendingApplicationsJoin.eventId.equals(tEvents.eventId))
            .and(pendingApplicationsJoin.teamId.equals(tTeams.teamId))
        .where(tEvents.eventSlug.equals(eventSlug))
        .select({
            event: {
                name: tEvents.eventShortName,
                slug: tEvents.eventSlug,
            },
            teams: dbInstance.aggregateAsArray({
                id: tTeams.teamId,
                name: tTeams.teamName,
                slug: tTeams.teamEnvironment,
                color: tTeams.teamColourLightTheme,
                pendingApplications: pendingApplicationsJoin.applications,
            }),
        })
        .groupBy(tEvents.eventId)
        .executeSelectNoneOrOne();
}

/**
 * Props accepted by the <EventLayout> component.
 */
interface EventLayoutProps {
    /**
     * Parameters passed to the component by the NextJS router.
     */
    params: {
        /**
         * The slug included in the URL. Used to uniquely identify the event.
         */
        slug: string;

        /**
         * Search parameters given in the URL.
         */
        searchParams: Record<string, string>;
    };
}

/**
 * Layout of the event overview page in the volunteer portal administration area. This shows the
 * options available to Senior+ volunteers for the organisation of a particular event.
 */
export default async function EventLayout(props: React.PropsWithChildren<EventLayoutProps>) {
    if (typeof props.params.slug !== 'string' || !props.params.slug.length)
        notFound();

    const { slug } = props.params;

    const user = await requireUser();

    const info = await fetchEventSidebarInformation(user, slug);
    if (!info)
        notFound();

    // Sort the teams included in the |info|. While JSON_ARRAYAGG accepts its own ORDER BY clause,
    // this is not yet supported by `ts-sql-query`. This'll do in the mean time.
    info.teams.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));

    const volunteersMenu: AdminSidebarMenuEntry[] = [
        {
            icon: <GridViewIcon />,
            label: 'Dashboard',
            url: `/admin/events/${slug}`,
        },
        {
            icon: <HotelIcon />,
            label: 'Hotels',
            privilege: Privilege.EventHotelManagement,
            url: `/admin/events/${slug}/hotels`,
        },
        {
            icon: <HistoryEduIcon />,
            label: 'Trainings',
            privilege: Privilege.EventTrainingManagement,
            url: `/admin/events/${slug}/training`,
        },
        {
            icon: <SettingsIcon />,
            label: 'Settings',
            privilege: Privilege.EventAdministrator,
            url: `/admin/events/${slug}/settings`,
        },
        {
            divider: true,
        }
    ];

    for (const team of info.teams) {
        volunteersMenu.push({
            icon: <PeopleIcon htmlColor={team.color} />,
            label: team.name,

            defaultOpen: false,  // FIXME
            menu: [
                {
                    icon: <NewReleasesIcon />,
                    label: 'Applications',
                    url: `/admin/events/${slug}/${team.slug}/applications`,
                    badge: team.pendingApplications,
                },
                {
                    icon: <FeedOutlinedIcon />,
                    label: 'Content',
                    url: `/admin/events/${slug}/${team.slug}/content`,
                },
                {
                    icon: <PersonIcon />,
                    label: 'Volunteers',
                    url: `/admin/events/${slug}/${team.slug}/volunteers`,
                },
            ],
        });
    }

    return (
        <AdminContent>
            <AdminSidebar menu={volunteersMenu} title={info.event.name} user={user.toUserData()} />
            <AdminPageContainer>
                {props.children}
            </AdminPageContainer>
        </AdminContent>
    )
}

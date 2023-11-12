// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import FeedOutlinedIcon from '@mui/icons-material/FeedOutlined';
import GridViewIcon from '@mui/icons-material/GridView';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import HotelIcon from '@mui/icons-material/Hotel';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import RepeatIcon from '@mui/icons-material/Repeat';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';

import type { User } from '@lib/auth/User';
import { AdminContent } from '../../AdminContent';
import { AdminPageContainer } from '../../AdminPageContainer';
import { type AdminSidebarMenuEntry, type AdminSidebarMenuSubMenuItem, AdminSidebar }
    from '../../AdminSidebar';
import { Privilege } from '@lib/auth/Privileges';
import { RegistrationStatus } from '@lib/database/Types';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

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
        .groupBy('teamId')
        .forUseInQueryAs('PendingApplications')
        .forUseInLeftJoinAs('PendingApplications');

    const eventsTeamsJoin = tEventsTeams.forUseInLeftJoin();
    const teamsJoin = tTeams.forUseInLeftJoin();
    const usersEventsJoin = tUsersEvents.forUseInLeftJoin();

    return await dbInstance.selectFrom(tEvents)
        .leftJoin(eventsTeamsJoin)
            .on(eventsTeamsJoin.eventId.equals(tEvents.eventId))
            .and(eventsTeamsJoin.enableTeam.equals(/* true= */ 1))
        .leftJoin(teamsJoin)
            .on(teamsJoin.teamId.equals(eventsTeamsJoin.teamId))
        .leftJoin(pendingApplicationsJoin)
            .on(pendingApplicationsJoin.eventId.equals(tEvents.eventId))
            .and(pendingApplicationsJoin.teamId.equals(teamsJoin.teamId))
        .leftJoin(usersEventsJoin)
            .on(usersEventsJoin.eventId.equals(tEvents.eventId))
            .and(usersEventsJoin.registrationStatus.equals(RegistrationStatus.Accepted))
            .and(usersEventsJoin.userId.equals(user.userId))
        .where(tEvents.eventSlug.equals(eventSlug))
        .select({
            event: {
                name: tEvents.eventShortName,
                slug: tEvents.eventSlug,
            },
            teams: dbInstance.aggregateAsArray({
                id: teamsJoin.teamId,
                name: teamsJoin.teamName,
                slug: teamsJoin.teamEnvironment,
                color: teamsJoin.teamColourLightTheme,
                managesFirstAid: teamsJoin.teamManagesFirstAid.equals(/* true= */ 1),
                managesSecurity: teamsJoin.teamManagesSecurity.equals(/* true= */ 1),
                pendingApplications: pendingApplicationsJoin.applications,
            }),
            user: {
                teamId: usersEventsJoin.teamId,
            },
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

    const { user } = await requireAuthenticationContext();

    const info = await fetchEventSidebarInformation(user, slug);
    if (!info)
        notFound();

    // Sort the teams included in the |info|. While JSON_ARRAYAGG accepts its own ORDER BY clause,
    // this is not yet supported by `ts-sql-query`. This'll do in the mean time.
    info.teams.sort((lhs, rhs) => lhs.name!.localeCompare(rhs.name!));

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
            icon: <MonetizationOnIcon />,
            label: 'Refunds',
            privilege: Privilege.Refunds,
            url: `/admin/events/${slug}/refunds`,
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
        const firstAidEntry: AdminSidebarMenuSubMenuItem['menu'] = [ /* empty */ ];
        if (team.managesFirstAid && false) {
            firstAidEntry.push({
                icon: <LocalHospitalIcon />,
                label: 'First aid',
                url: `/admin/events/${slug}/${team.slug}/first-aid`,
                privilege: Privilege.EventSupportingTeams,
            });
        }

        const securityEntry: AdminSidebarMenuSubMenuItem['menu'] = [ /* empty */ ];
        if (team.managesSecurity && false) {
            securityEntry.push({
                icon: <SecurityIcon />,
                label: 'Security',
                url: `/admin/events/${slug}/${team.slug}/security`,
                privilege: Privilege.EventSupportingTeams,
            });
        }

        volunteersMenu.push({
            icon: <PeopleIcon htmlColor={team.color} />,
            label: team.name!,

            defaultOpen: info.user?.teamId === team.id,
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
                ...firstAidEntry,
                {
                    icon: <RepeatIcon />,
                    label: 'Retention',
                    privilege: Privilege.EventRetentionManagement,
                    url: `/admin/events/${slug}/${team.slug}/retention`,
                },
                ...securityEntry,
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
            <AdminSidebar menu={volunteersMenu} title={info.event.name} user={user} />
            <AdminPageContainer>
                {props.children}
            </AdminPageContainer>
        </AdminContent>
    )
}

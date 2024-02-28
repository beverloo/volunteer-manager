// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import EventNoteIcon from '@mui/icons-material/EventNote';
import FeedOutlinedIcon from '@mui/icons-material/FeedOutlined';
import GridViewIcon from '@mui/icons-material/GridView';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import HotelIcon from '@mui/icons-material/Hotel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import RepeatIcon from '@mui/icons-material/Repeat';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';

import type { User } from '@lib/auth/User';
import { AdminContent } from '../../AdminContent';
import { AdminPageContainer } from '../../AdminPageContainer';
import { type AdminSidebarMenuEntry, type AdminSidebarMenuSubMenuItem, AdminSidebar }
    from '../../AdminSidebar';
import { Privilege, can } from '@lib/auth/Privileges';
import { RegistrationStatus } from '@lib/database/Types';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

import db, { tActivities, tEvents, tEventsTeams, tHotelsAssignments, tHotelsBookings,
    tHotelsPreferences, tRefunds, tShifts, tTeams, tTrainingsAssignments, tUsersEvents }
    from '@lib/database';

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
                id: tEvents.eventId,
                name: tEvents.eventShortName,
                slug: tEvents.eventSlug,
                festivalId: tEvents.eventFestivalId,
            },
            teams: dbInstance.aggregateAsArray({
                id: teamsJoin.teamId,
                name: teamsJoin.teamName,
                slug: teamsJoin.teamEnvironment,
                color: teamsJoin.teamColourLightTheme,
                managesFaq: teamsJoin.teamManagesFaq.equals(/* true= */ 1),
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

    // If the user has the ability to see any of the additional menu items, execute a single query
    // to understand how many outstanding items there are for hotels, refunds and trainings. Only
    // the ones that the user is privileged to access will be populated.
    let hotelBadge: number | undefined;
    let refundsBadge: number | undefined;
    let trainingsBadge: number | undefined;

    if (can(user, Privilege.EventHotelManagement) ||
            can(user, Privilege.EventTrainingManagement) ||
            can(user, Privilege.Refunds))
    {
        const hotelsAssignmentsJoin = tHotelsAssignments.forUseInLeftJoin();
        const hotelsBookingsJoin = tHotelsBookings.forUseInLeftJoin();

        const dbInstance = db;
        const hotelSubQuery = dbInstance.selectFrom(tHotelsPreferences)
            .leftJoin(hotelsAssignmentsJoin)
                .on(hotelsAssignmentsJoin.assignmentUserId.equals(tHotelsPreferences.userId))
                    .and(hotelsAssignmentsJoin.eventId.equals(tHotelsPreferences.eventId))
            .leftJoin(hotelsBookingsJoin)
                .on(hotelsBookingsJoin.bookingId.equals(hotelsAssignmentsJoin.bookingId))
                    .and(hotelsBookingsJoin.bookingVisible.equals(/* true= */ 1))
            .where(tHotelsPreferences.eventId.equals(info.event.id))
                .and(tHotelsPreferences.hotelId.isNotNull())
                .and(hotelsAssignmentsJoin.assignmentId.isNull().or(
                    hotelsBookingsJoin.bookingConfirmed.equals(/* false= */ 0)))
            .selectCountAll()
            .forUseAsInlineQueryValue();

        const refundsSubQuery = dbInstance.selectFrom(tRefunds)
            .where(tRefunds.eventId.equals(info.event.id))
                .and(tRefunds.refundConfirmed.isNull())
            .selectCountAll()
            .forUseAsInlineQueryValue();

        const trainingsSubQuery = dbInstance.selectFrom(tTrainingsAssignments)
            .where(tTrainingsAssignments.eventId.equals(info.event.id))
                .and(tTrainingsAssignments.assignmentUserId.isNotNull())
                .and(tTrainingsAssignments.assignmentConfirmed.equals(/* false= */ 0))
            .selectCountAll()
            .forUseAsInlineQueryValue();

        const badgeValues = await db.selectFromNoTable()
            .select({
                unconfirmedHotelRequests: hotelSubQuery,
                unconfirmedRefunds: refundsSubQuery,
                unconfirmedTrainings: trainingsSubQuery,
            })
            .executeSelectNoneOrOne();

        if (can(user, Privilege.EventHotelManagement))
            hotelBadge = badgeValues?.unconfirmedHotelRequests;
        if (can(user, Privilege.Refunds))
            refundsBadge = badgeValues?.unconfirmedRefunds;
        if (can(user, Privilege.EventTrainingManagement))
            trainingsBadge = badgeValues?.unconfirmedTrainings;
    }

    // Only display the "Program" entry when an event has been associated with a Festival ID. This
    // is how AnPlan maps the events, and we rely on the key to import information.
    const programEntry: AdminSidebarMenuEntry[] = [ /* empty */ ];
    if (!!info.event.festivalId) {
        const shiftsJoin = tShifts.forUseInLeftJoin();
        const unknownProgramEntries = await db.selectFrom(tActivities)
            .leftJoin(shiftsJoin)
                .on(shiftsJoin.shiftActivityId.equals(tActivities.activityId))
                    .and(shiftsJoin.eventId.equals(info.event.id))
            .where(tActivities.activityFestivalId.equals(info.event.festivalId))
                .and(tActivities.activityHelpNeeded.equals(/* true= */ 1))
                .and(tActivities.activityRequestAssignee.isNull())
                .and(tActivities.activityDeleted.isNull())
                .and(shiftsJoin.shiftId.isNull())
            .selectCountAll()
            .executeSelectOne();

        programEntry.push({
            icon: <EventNoteIcon />,
            label: 'Program',
            url: `/admin/events/${slug}/program/requests`,
            urlPrefix: `/admin/events/${slug}/program`,
            badge: unknownProgramEntries,
            badgeSeverity: 'error',
        });
    }

    const volunteersMenu: AdminSidebarMenuEntry[] = [
        {
            icon: <GridViewIcon />,
            label: 'Dashboard',
            url: `/admin/events/${slug}`,
            urlMatchMode: 'strict',
        },
        {
            icon: <HotelIcon />,
            label: 'Hotels',
            privilege: Privilege.EventHotelManagement,
            url: `/admin/events/${slug}/hotels`,
            badge: hotelBadge,
        },
        ...programEntry,
        {
            icon: <MonetizationOnIcon />,
            label: 'Refunds',
            privilege: Privilege.Refunds,
            url: `/admin/events/${slug}/refunds`,
            badge: refundsBadge,
            badgeSeverity: 'error',
        },
        {
            icon: <HistoryEduIcon />,
            label: 'Trainings',
            privilege: Privilege.EventTrainingManagement,
            url: `/admin/events/${slug}/training`,
            badge: trainingsBadge,
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
        const faqEntry: AdminSidebarMenuSubMenuItem['menu'] = [ /* empty */ ];
        if (team.managesFaq) {
            faqEntry.push({
                icon: <InfoOutlinedIcon />,
                label: 'Knowledge base',
                url: `/admin/events/${slug}/${team.slug}/faq`,
            });
        }

        const firstAidEntry: AdminSidebarMenuSubMenuItem['menu'] = [ /* empty */ ];
        if (team.managesFirstAid) {
            firstAidEntry.push({
                icon: <LocalHospitalIcon />,
                label: 'First aid',
                url: `/admin/events/${slug}/${team.slug}/first-aid`,
                privilege: Privilege.EventSupportingTeams,
            });
        }

        const securityEntry: AdminSidebarMenuSubMenuItem['menu'] = [ /* empty */ ];
        if (team.managesSecurity) {
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
                    badgeSeverity: 'error',
                },
                {
                    icon: <FeedOutlinedIcon />,
                    label: 'Content',
                    url: `/admin/events/${slug}/${team.slug}/content`,
                },
                ...faqEntry,
                ...firstAidEntry,
                {
                    icon: <RepeatIcon />,
                    label: 'Retention',
                    privilege: Privilege.EventRetentionManagement,
                    url: `/admin/events/${slug}/${team.slug}/retention`,
                },
                {
                    icon: <ScheduleIcon />,
                    label: 'Schedule',
                    privilege: Privilege.Administrator,  // todo: publish the page
                    url: `/admin/events/${slug}/${team.slug}/schedule`,
                },
                ...securityEntry,
                {
                    icon: <PendingActionsIcon />,
                    label: 'Shifts',
                    privilege: Privilege.Administrator,  // todo: publish the page
                    url: `/admin/events/${slug}/${team.slug}/shifts`,
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
            <AdminSidebar menu={volunteersMenu} title={info.event.name} user={user} />
            <AdminPageContainer>
                {props.children}
            </AdminPageContainer>
        </AdminContent>
    )
}

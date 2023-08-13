// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import DifferenceIcon from '@mui/icons-material/Difference';
import FeedOutlinedIcon from '@mui/icons-material/FeedOutlined';
import GridViewIcon from '@mui/icons-material/GridView';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import HotelIcon from '@mui/icons-material/Hotel';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';

import { AdminContent } from '../../AdminContent';
import { AdminPageContainer } from '../../AdminPageContainer';
import { type AdminSidebarMenuEntry, AdminSidebar } from '../../AdminSidebar';
import { Privilege, can } from '@lib/auth/Privileges';
import { User } from '@lib/auth/User';
import { kEnvironmentColours } from '@app/Environment';
import { requireUser } from '@lib/auth/getUser';

/**
 * Fetch the information about the event identified by `eventSlug` that is applicable to the given
 * `user`, with access checks being in place. The menu will be rendered based on this information.
 */
async function fetchEventSidebarInformation(user: User, eventSlug: string) {

    return {
        event: {
            name: 'AnimeCon 2024',
            slug: eventSlug,
        },

        availabilityAvailable: false,
        hotelAvailable: false,
        trainingAvailable: false,

        teams: [
            {
                name: 'Crew',
                slug: 'gophers.team',
                color: kEnvironmentColours['gophers.team'].light,
                defaultOpen: false,
                pendingApplications: 12,
            },
            {
                name: 'Hosts',
                slug: 'hosts.team',
                color: kEnvironmentColours['hosts.team'].light,
                defaultOpen: false,
                pendingApplications: 0,
            },
            {
                name: 'Stewards',
                slug: 'stewards.team',
                color: kEnvironmentColours['stewards.team'].light,
                defaultOpen: true,
                pendingApplications: 1,
            }
        ],
    };
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

    const volunteersMenu: AdminSidebarMenuEntry[] = [
        {
            icon: <GridViewIcon />,
            label: 'Dashboard',
            url: `/admin/events/${slug}`,
        },
        {
            icon: <HotelIcon />,
            label: 'Hotels',
            privilege: Privilege.EventAdministrator,
            url: `/admin/events/${slug}/hotels`,
        },
        {
            icon: <HistoryEduIcon />,
            label: 'Training',
            privilege: Privilege.EventAdministrator,
            url: `/admin/events/${slug}/training`,
        },
        {
            divider: true,
        }
    ];

    for (const team of info.teams) {
        volunteersMenu.push({
            icon: <PeopleIcon htmlColor={team.color} />,
            label: team.name,

            defaultOpen: team.defaultOpen,
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
                    icon: <DifferenceIcon />,
                    label: 'Retention',
                    url: `/admin/events/${slug}/${team.slug}/retention`,
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

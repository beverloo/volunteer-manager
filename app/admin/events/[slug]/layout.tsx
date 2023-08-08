// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import DifferenceIcon from '@mui/icons-material/Difference';
import PersonIcon from '@mui/icons-material/Person';

import { AdminContent } from '../../AdminContent';
import { AdminPageContainer } from '../../AdminPageContainer';
import { type AdminSidebarMenuEntry, AdminSidebar } from '../../AdminSidebar';
import { getEventBySlug } from '@lib/EventLoader';
import { requireUser } from '@lib/auth/getUser';

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
    const event = await getEventBySlug(slug);

    // TODO: Access checks for the |user| to the |event|

    if (!event)
        notFound();

    const volunteersMenu: AdminSidebarMenuEntry[] = [
        {
            icon: <DifferenceIcon />,
            label: 'Retention',
            url: `/admin/events/${slug}/retention`,
        },
        {
            icon: <PersonIcon />,
            label: 'Volunteers',
            url: `/admin/events/${slug}/volunteers`,
        },
    ];

    return (
        <AdminContent>
            <AdminSidebar menu={volunteersMenu} title={event.shortName} user={user.toUserData()} />
            <AdminPageContainer>
                {props.children}
            </AdminPageContainer>
        </AdminContent>
    )
}

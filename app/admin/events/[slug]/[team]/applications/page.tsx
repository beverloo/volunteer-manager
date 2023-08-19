// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRouterParams } from '@lib/NextRouterParams';
import { generateEventMetadataFn } from '../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

import { ApplicationImport } from './ApplicationImport';
import { Applications, type ApplicationInfo } from './Applications';
import { Header } from './Header';

/**
 * The Applications page allows senior volunteers to see, and sometimes modify the incoming requests
 * for people who want to participate in this event. Event administrators can also directly create
 * new applications on this page themselves.
 */
export default async function EventApplicationsPage(props: NextRouterParams<'slug' | 'team'>) {
    const { event, team, user } = await verifyAccessAndFetchPageInfo(props.params);

    const applications: ApplicationInfo[] = [];

    return (
        <>
            <Header event={event} team={team} user={user.toUserData()} />
            <Applications applications={applications} />
            <ApplicationImport />
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Applications');

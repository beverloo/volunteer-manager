// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRouterParams } from '@lib/NextRouterParams';
import { UnderConstructionPaper } from '@app/admin/UnderConstructionPaper';
import { generateEventMetadataFn } from '../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

export default async function EventApplicationsPage(props: NextRouterParams<'slug' | 'team'>) {
    const { event, team } = await verifyAccessAndFetchPageInfo(props.params);

    return (
        <UnderConstructionPaper>
            {event.shortName} {team.name} applications
        </UnderConstructionPaper>
    );
}

export const generateMetadata = generateEventMetadataFn('Applications');

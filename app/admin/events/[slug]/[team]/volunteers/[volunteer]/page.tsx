// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRouterParams } from '@lib/NextRouterParams';
import { UnderConstructionPaper } from '@app/admin/UnderConstructionPaper';
import { generateEventMetadataFn } from '../../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

type RouterParams = NextRouterParams<'slug' | 'team' | 'volunteer'>;

/**
 * Displays information about an individual volunteer and their participation in a particular event.
 * Different from the general volunteer account information page, which can only be accessed by a
 * more limited number of people.
 */
export default async function EventVolunteerPage(props: RouterParams) {
    const { event, team } = await verifyAccessAndFetchPageInfo(props.params);

    return (
        <UnderConstructionPaper>
            {event.shortName} {team.name} individual ({props.params.volunteer})
        </UnderConstructionPaper>
    );
}

export const generateMetadata = generateEventMetadataFn('Volunteer');

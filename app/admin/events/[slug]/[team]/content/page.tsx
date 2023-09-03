// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { ContentList } from '@app/admin/content/ContentList';
import { Privilege, can } from '@lib/auth/Privileges';
import { createEventScope } from '@app/admin/content/ContentScope';
import { generateEventMetadataFn } from '../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * The <EventContentPage> page lists the content that's associated with a particular team and a
 * particular event. It includes a mixture of required (fixed) content and dynamic content.
 */
export default async function EventContentPage(props: NextRouterParams<'slug' | 'team'>) {
    const { event, team, user } = await verifyAccessAndFetchPageInfo(props.params);

    const enableAuthorLink = can(user, Privilege.VolunteerAdministrator);
    const scope = createEventScope(event.id, team.id);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                Content
            </Typography>
            <ContentList enableAuthorLink={enableAuthorLink} scope={scope} />
        </Paper>
    );
}

export const generateMetadata = generateEventMetadataFn('Content');

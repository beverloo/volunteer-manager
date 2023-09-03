// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { ContentCreate } from '@app/admin/content/ContentCreate';
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
    const pathPrefix = `/registration/${event.slug}/`;
    const scope = createEventScope(event.id, team.id);

    return (
        <>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ pb: 1 }}>
                    Pages
                    <Typography component="span" variant="h5" color="action.active" sx={{ pl: 1 }}>
                        ({team.slug} for {event.shortName})
                    </Typography>
                </Typography>
                <ContentList enableAuthorLink={enableAuthorLink} pathPrefix={pathPrefix}
                             scope={scope} />
            </Paper>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ pb: 1 }}>
                    Create a new page
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                    You can create a new page for the <strong>{team.name}</strong>, which will
                    immediately be published on <strong>{team.slug}</strong>.
                </Alert>
                <ContentCreate pathPrefix={pathPrefix} scope={scope} />
            </Paper>
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Content');

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { ContentEditor } from '@app/admin/content/ContentEditor';
import { createEventScope } from '@app/admin/content/ContentScope';
import { generateEventMetadataFn } from '../../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * The <EventContentEntryPage> page displays an individual piece of content that can be edited by
 * the volunteer. The <ContentEditor> component takes care of the actual behaviour.
 */
export default async function EventContentEntryPage(props: NextRouterParams<'slug' | 'team' | 'id'>)
{
    const { event, team } = await verifyAccessAndFetchPageInfo(props.params);

    const pathPrefix = `/registration/${event.slug}/`;
    const scope = createEventScope(event.id, team.id);

    return (
        <ContentEditor contentId={parseInt(props.params.id)} pathPrefix={pathPrefix} scope={scope}>
            <Typography variant="h5" sx={{ pb: 1 }}>
                Page editor
                <Typography component="span" variant="h5" color="action.active" sx={{ pl: 1 }}>
                    ({team.slug} for {event.shortName})
                </Typography>
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
                You are editing content on <strong>{team.slug}</strong>, any changes that you save
                will be published immediately.
            </Alert>
        </ContentEditor>
    );
}

export const generateMetadata = generateEventMetadataFn('Content');

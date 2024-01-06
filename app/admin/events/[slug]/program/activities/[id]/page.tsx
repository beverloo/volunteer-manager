// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Typography from '@mui/material/Typography';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * The <ProgramLayout> component contains the common elements between the different pages that make
 * up the Program section of the Volunteer Manager. A program is bound to an event.
 */
export default async function ProgramActivityPage(props: NextRouterParams<'slug' | 'id'>) {
    const { event } = await verifyAccessAndFetchPageInfo(props.params);

    return (
        <Typography variant="body2">
            ProgramActivityPage ({props.params.slug}, {props.params.id})
        </Typography>
    );
}

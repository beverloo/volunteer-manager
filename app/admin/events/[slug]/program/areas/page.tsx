// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Typography from '@mui/material/Typography';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * The <ProgramAreasPage> component contains the areas that are part of the program of a particular
 * event, or rather, its location. Each area links through to a detailed page.
 */
export default async function ProgramAreasPage(props: NextRouterParams<'slug'>) {
    const { event } = await verifyAccessAndFetchPageInfo(props.params);

    return (
        <Typography variant="body2">
            ProgramAreasPage ({props.params.slug})
        </Typography>
    );
}

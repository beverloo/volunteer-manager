// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Typography from '@mui/material/Typography';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * The <ProgramAreaPage> component contains the information about an individual area that's part of
 * the festival's program. Limited modifications can be made by the volunteering leads.
 */
export default async function ProgramAreaPage(props: NextRouterParams<'slug' | 'id'>) {
    const { event } = await verifyAccessAndFetchPageInfo(props.params);

    return (
        <Typography variant="body2">
            ProgramAreaPage ({props.params.slug}, {props.params.id})
        </Typography>
    );
}

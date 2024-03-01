// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Typography from '@mui/material/Typography';

import { Privilege } from '@lib/auth/Privileges';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <ScheduleMainPage> component contains the main page of the schedule, that shows an overview
 * of the things we'd like the volunteer to know about.
 */
export default async function ScheduleMainPage() {
    await requireAuthenticationContext({
        privilege: Privilege.Administrator,
    });

    return (
        <Typography variant="body1">
            This page is not available yet.
        </Typography>
    );
}

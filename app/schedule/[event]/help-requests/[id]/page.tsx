// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';

import type { NextPageParams } from '@lib/NextRouterParams';
import { Privilege } from '@lib/auth/Privileges';
import { SetTitle } from '../../components/SetTitle';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The <ScheduleHelpRequestPage> component displays a page for a given help request. It's only
 * available for volunteers with a specific permission, as it potentially could contain sensitive
 * information.
 */
export default async function ScheduleHelpRequestPage(props: NextPageParams<'event' | 'id'>) {
    await requireAuthenticationContext({
        check: 'event',
        event: props.params.event,
        privilege: Privilege.EventHelpRequests,
    });

    return (
        <>
            <SetTitle title="Help request" />
            <Card>
                <Box sx={{
                    backgroundImage: 'url(/images/help-request.jpg)',
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    width: '100%',
                    aspectRatio: 4 }} />
            </Card>
            { /* TODO: Show information about the request */ }
            { /* TODO: Show information about who acknowledged the request */ }
            { /* TODO: Ability to acknowledge the request if that hasn't happened yet */ }
            { /* TODO: Show information about who closed the request, and why */ }
            { /* TODO: Ability to close the request if that hasn't happened yet */ }
        </>
    );
}

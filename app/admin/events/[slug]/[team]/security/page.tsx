// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { NextPageParams } from '@lib/NextRouterParams';
import { Privilege } from '@lib/auth/Privileges';
import { generateEventMetadataFn } from '../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * The security team (normally supporting the Stewards) is responsible for the physical security of
 * our visitors and volunteers. They're a vendor team, and therefore not considered volunteers.
 */
export default async function EventTeamSecurityPage(props: NextPageParams<'slug' | 'team'>) {
    const { event, team } = await verifyAccessAndFetchPageInfo(
        props.params, Privilege.EventSupportingTeams);

    if (!team.managesSecurity)
        notFound();

    return (
        <>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5">
                    Security
                    <Typography component="span" variant="h5" color="action.active" sx={{ pl: 1 }}>
                        ({event.shortName})
                    </Typography>
                </Typography>
                <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
                    This page allows you to manage the <strong>security vendor team</strong>, who
                    are responsible for keeping our visitors and volunteers safe and secure.
                </Alert>
                { /* TODO: Vendor table */ }
            </Paper>
            { /* TODO: Timeline */ }
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Security');

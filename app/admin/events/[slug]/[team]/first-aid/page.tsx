// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { NextPageParams } from '@lib/NextRouterParams';
import { Privilege } from '@lib/auth/Privileges';
import { VendorTable } from './VendorTable';
import { VendorTeam } from '@lib/database/Types';
import { generateEventMetadataFn } from '../../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * The first aid team (normally supporting the Stewards) is responsible for making sure that all our
 * visitors are safe, and any incidents are taken care of.
 */
export default async function EventTeamFirstAidPage(props: NextPageParams<'slug' | 'team'>) {
    const { event, team } = await verifyAccessAndFetchPageInfo(
        props.params, Privilege.EventSupportingTeams);

    if (!team.managesFirstAid)
        notFound();

    return (
        <>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5">
                    First aid
                    <Typography component="span" variant="h5" color="action.active" sx={{ pl: 1 }}>
                        ({event.shortName})
                    </Typography>
                </Typography>
                <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
                    This page allows you to manage the <strong>first aid vendor team</strong>, who
                    are responsible for keeping our visitors and volunteers alive and well. We need
                    to know their full name in order to issue a valid ticket, and optionally their
                    t-shirt preferences when it is appropriate to grant one.
                </Alert>
                <VendorTable event={event.slug} team={VendorTeam.FirstAid} />
            </Paper>
            { /* TODO: Timeline */ }
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('First aid');

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { Privilege, can } from '@lib/auth/Privileges';
import { RefundsHeader } from './RefundsHeader';
import { RefundsTable } from './RefundsTable';
import { generateEventMetadataFn } from '../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * The <EventRefundsPage> page allows select volunteers who are both event administrators and have
 * access to the volunteering refunds to see the overview of requested refunds for a given event.
 */
export default async function EventRefundsPage(props: NextRouterParams<'slug'>) {
    const { user, event } = await verifyAccessAndFetchPageInfo(props.params);

    // Access to event settings is restricted to event administrators who also have the volunteer
    // refund permission, since this deals with particularly sensitive information.
    if (!can(user, Privilege.EventAdministrator) || !can(user, Privilege.Refunds))
        notFound();

    const enableExport = can(user, Privilege.VolunteerDataExports);

    return (
        <>
            <RefundsHeader enableExport={enableExport} event={event} />
            <RefundsTable event={event.slug} />
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Refunds');

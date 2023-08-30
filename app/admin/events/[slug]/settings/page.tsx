// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { EventSettings } from './EventSettings';
import { Privilege, can } from '@lib/auth/Privileges';
import { SettingsHeader } from './SettingsHeader';
import { TeamSettings } from './TeamSettings';
import { generateEventMetadataFn } from '../generateEventMetadataFn';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

/**
 * The <EventSettingsPage> page allows event administrators to make changes to an event, such as its
 * name, slug, target team sizes and so on. These have an effect on the entire Volunteer Manager.
 */
export default async function EventSettingsPage(props: NextRouterParams<'slug'>) {
    const { user, event } = await verifyAccessAndFetchPageInfo(props.params);

    // Access to event settings is restricted to event administrators.
    if (!can(user, Privilege.EventAdministrator))
        notFound();

    return (
        <>
            <SettingsHeader event={event} />
            <EventSettings event={event} />
            <TeamSettings event={event} />
        </>
    );
}

export const generateMetadata = generateEventMetadataFn('Settings');

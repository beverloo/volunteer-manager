// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { notFound } from 'next/navigation';

import type { NextPageParams } from '@lib/NextRouterParams';
import { AccountSettings } from './AccountSettings';
import { createGenerateMetadataFn } from '@app/admin/lib/generatePageMetadata';
import { getExampleMessagesForUser } from '@app/admin/lib/getExampleMessagesForUser';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import { updateAccountSettings } from '../AccountActions';

/**
 * The <AccountSettingsPage> component displays the settings that have been associated with this
 * profile. It defers to a component that's available in other places of the admin area as well.
 */
export default async function AccountSettingsPage(props: NextPageParams<'id'>) {
    const { access } = await requireAuthenticationContext({
        check: 'admin',
        permission: {
            permission: 'organisation.accounts',
            operation: 'read',
        },
    });

    const userId = parseInt((await props.params).id, /* radix= */ 10);
    if (!Number.isSafeInteger(userId))
        notFound();

    const exampleMessages = await getExampleMessagesForUser(userId);
    const updateAccountSettingsFn = updateAccountSettings.bind(null, userId);

    const readOnly = !access.can('organisation.accounts', 'update');

    return (
        <AccountSettings updateAccountSettingsFn={updateAccountSettingsFn}
                         exampleMessages={exampleMessages}
                         readOnly={readOnly} />
    );
}

export const generateMetadata =
    createGenerateMetadataFn('Settings', { user: 'id' }, 'Accounts', 'Organisation');

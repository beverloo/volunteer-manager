// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { AdminHeader } from './AdminHeader';
import { AdminLayout } from './AdminLayout';
import { MuiLicense } from './components/MuiLicense';
import { getHeaderEventsForUser } from './AdminUtils';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * Layout of the administration section of the Volunteer Manager. The layout is the same for every
 * (signed in) user, although the available options will depend on the user's access level.
 */
export default async function RootAdminLayout(props: React.PropsWithChildren) {
    const { access, user } = await requireAuthenticationContext({ check: 'admin' });
    const events = await getHeaderEventsForUser(access);

    return (
        <>
            <MuiLicense />
            <AdminLayout>
                <AdminHeader events={events} user={user} />
                {props.children}
            </AdminLayout>
        </>
    );
}

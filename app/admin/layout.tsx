// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { AdminHeader } from './AdminHeader';
import { AdminLayout } from './AdminLayout';
import { AdminSidebar } from './AdminSidebar';

import { useUser } from '../lib/auth/useUser';

/**
 * Layout of the administration section of the Volunteer Manager. The layout is the same for every
 * (signed in) user, although the available options will depend on the user's access level.
 */
export default async function RootAdminLayout(props: any) {
    const user = await useUser('ignore');  // eslint-disable-line

    return (
        <AdminLayout header={ <AdminHeader /> }
                     sidebar={ <AdminSidebar privileges={user!.privileges} /> }>
            {props.children}
        </AdminLayout>
    );
}

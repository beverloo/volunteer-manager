// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { AdminHeader } from './AdminHeader';
import { AdminLayout } from './AdminLayout';
import { requireUser } from '../lib/auth/getUser';

/**
 * Layout of the administration section of the Volunteer Manager. The layout is the same for every
 * (signed in) user, although the available options will depend on the user's access level.
 */
export default async function RootAdminLayout(props: any) {
    const user = await requireUser();

    return (
        <AdminLayout>
            <AdminHeader user={user.toUserData()} />
            {props.children}
        </AdminLayout>
    );
}

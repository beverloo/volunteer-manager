// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Metadata } from 'next';

import Box from '@mui/material/Box';

import { AdminContent } from './AdminContent';
import { AdminPageContainer } from './AdminPageContainer';
import { AdminSidebar } from './AdminSidebar';
import { requireUser } from '../lib/auth/getUser';

export default async function AdminPage() {
    const user = await requireUser();

    return (
        <AdminContent>
            <AdminSidebar title="Dashboard" />
            <AdminPageContainer>
                <Box sx={{ backgroundColor: 'yellow' }}>
                    Yo
                </Box>
            </AdminPageContainer>
        </AdminContent>
    );
}

export const metadata: Metadata = {
    title: 'Volunteer Administration',
};

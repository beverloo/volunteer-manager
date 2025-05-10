// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

import { kDashboardPermissions } from './dashboard/DashboardPermissions';

/**
 * The <OrganisationPage> component describes the dashboard of our organisation area, which focuses
 * on providing fast access to account management and highlights potential warnings and issues that
 * could require the attention of one of our administrators.
 */
export default async function OrganisationPage() {
    await requireAuthenticationContext({
        check: 'admin',
        permission: kDashboardPermissions,
    });

    // TODO: Header card providing fast access to an account
    // TODO: Card displaying unresolved account warnings
    // TODO: Card displaying recently received feedback
    // TODO: Card displaying recently seen displays

    return (
        <>
            You have access
        </>
    );
}

export const metadata: Metadata = {
    title: 'Organisation | AnimeCon Volunteer Manager',
};

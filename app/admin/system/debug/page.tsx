// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Table from '@mui/material/Table';

import { DebugOptions } from './DebugOptions';
import { Privilege } from '@lib/auth/Privileges';
import { Section } from '@app/admin/components/Section';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * The debug page displays debugging information regarding NextJS and AnimeCon Volunteer Manager
 * internals that we'd like to see in production, but don't really know how to.
 */
export default async function DebugPage() {
    await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.SystemAdministrator,
    });

    const debugValues: Record<string, any> = {};
    debugValues['Cookies'] = [ ...cookies() ];
    debugValues['Headers'] = [ ...headers() ];

    return (
        <>
            <DebugOptions />
            <Section title="Debugging information">
                <Table size="small">
                    { Object.entries(debugValues).map(([ key, value ], index) =>
                        <TableRow key={index}>
                            <TableCell width="15%">
                                <strong>{key}</strong>
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                                { JSON.stringify(value, undefined, /* space= */ 4) }
                            </TableCell>
                        </TableRow> )}
                </Table>
            </Section>
        </>
    );
}

export const metadata: Metadata = {
    title: 'Debug | AnimeCon Volunteer Manager',
};

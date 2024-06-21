// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';

import { TextFieldElement } from '@proxy/react-hook-form-mui';

import Grid from '@mui/material/Unstable_Grid2';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Table from '@mui/material/Table';

import { DebugOptions } from './DebugOptions';
import { FormGridSection } from '@app/admin/components/FormGridSection';
import { Privilege } from '@lib/auth/Privileges';
import { Section } from '@app/admin/components/Section';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import { executeServerAction } from '@lib/serverAction';

/**
 * Zod scheme that the debug action will be validated against.
 */
const kDebugActionScheme = z.object({
    /**
     * The username submitted through the example form, required.
     */
    username: z.string().min(1, 'must have a value'),

    /**
     * Notes submitted through the example form, optional.
     */
    notes: z.string().optional(),
});

/**
 * Server action that will be invoked when the form section demo has been submitted. Reflects the
 * submitted data back to the client after a slight delay.
 */
async function debugAction(formData: unknown) {
    'use server';
    return executeServerAction(formData, kDebugActionScheme, async (data, props) => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { success: false, error: `Not yet implemented (${data.username})` };
    });
}

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
            <FormGridSection action={debugAction} title="Form section demo">
                <Grid xs={12} md={6}>
                    <TextFieldElement name="username" label="Username" size="small" fullWidth
                                      required />
                </Grid>
                <Grid xs={12} md={6}>
                    <TextFieldElement name="notes" label="Notes" size="small" fullWidth />
                </Grid>
            </FormGridSection>
            <Section title="Debugging information">
                <Table size="small">
                    <TableBody>
                        { Object.entries(debugValues).map(([ key, value ], index) =>
                            <TableRow key={index}>
                                <TableCell width="15%">
                                    <strong>{key}</strong>
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'pre-wrap',
                                                 overflowWrap: 'anywhere' }}>
                                    { JSON.stringify(value, undefined, /* space= */ 4) }
                                </TableCell>
                            </TableRow> )}
                    </TableBody>
                </Table>
            </Section>
        </>
    );
}

export const metadata: Metadata = {
    title: 'Debug | AnimeCon Volunteer Manager',
};

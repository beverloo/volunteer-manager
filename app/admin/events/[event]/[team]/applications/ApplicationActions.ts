// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { z } from 'zod';

import { executeServerAction } from '@lib/serverAction';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

/**
 * Zod type that describes that no data is expected.
 */
const kNoDataRequired = z.object({ /* no parameters */ });

/**
 * Server action that should be called when an application should be approved.
 */
export async function approveApplication(
    event: string, team: string, userId: number, formData: unknown)
{
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: {
                permission: 'event.applications',
                operation: 'update',
                scope: { event, team },
            },
        });

        return { success: false, error: 'Not yet implemented' };
    });
}

/**
 * Server action that should be called when a new application should be created.
 */
export async function createApplication(event: string, team: string, formData: unknown) {
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: {
                permission: 'event.applications',
                operation: 'create',
                scope: { event, team },
            },
        });

        return { success: false, error: 'Not yet implemented' };
    });
}

/**
 * Server action that should be called when an application should be moved to another team.
 */
export async function moveApplication(
    event: string, team: string, userId: number, formData: unknown)
{
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: {
                permission: 'event.applications',
                operation: 'update',
                scope: { event, team },
            },
        });

        return { success: false, error: 'Not yet implemented' };
    });
}

/**
 * Server action that should be called when a previously rejected application should be reconsidered
 */
export async function reconsiderApplication(
    event: string, team: string, userId: number, formData: unknown)
{
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: {
                permission: 'event.applications',
                operation: 'create',
                scope: { event, team },
            },
        });

        return { success: false, error: 'Not yet implemented' };
    });
}

/**
 * Server action that should be called when an application should be rejected.
 */
export async function rejectApplication(
    event: string, team: string, userId: number, formData: unknown)
{
    'use server';
    return executeServerAction(formData, kNoDataRequired, async (data, props) => {
        await requireAuthenticationContext({
            check: 'admin',
            permission: {
                permission: 'event.applications',
                operation: 'update',
                scope: { event, team },
            },
        });

        return { success: false, error: 'Not yet implemented' };
    });
}

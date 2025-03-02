// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';

import Alert from '@mui/material/Alert';

import { SchedulerCreateTaskPanel } from './SchedulerCreateTaskPanel';
import { SchedulerTaskTable } from './SchedulerTaskTable';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';

import { globalScheduler } from '@lib/scheduler/SchedulerImpl';

/**
 * The scheduler page gives an overview of the scheduler's state - both pending and past tasks, with
 * the ability to schedule a new task when so desired.
 */
export default async function SchedulerPage() {
    await requireAuthenticationContext({
        check: 'admin',
        permission: 'system.internals.scheduler',
    });

    return (
        <>
            { !globalScheduler.lastExecution &&
                <Alert severity="error" variant="filled">
                    The scheduler is not running on this Volunteer Manager instance.
                </Alert> }
            <SchedulerTaskTable />
            <SchedulerCreateTaskPanel />
        </>
    );
}

export const metadata: Metadata = {
    title: 'Scheduler | AnimeCon Volunteer Manager',
};

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { Temporal, formatDate } from '@lib/Temporal';

/**
 * Representation of the status of the Volunteer Manager scheduler.
 */
export interface SchedulerStatus {
    /**
     * Number of times that the scheduler has been executed.
     */
    executionCount: number;

    /**
     * Number of tasks that have been invoked by the scheduler.
     */
    invocationCount: number;

    /**
     * Number of milliseconds since the last execution of the scheduler.
     */
    timeSinceLastExecutionMs?: number;

    /**
     * Number of milliseconds since the last invocation from the scheduler.
     */
    timeSinceLastInvocationMs?: number;

    /**
     * The number of tasks that are currently pending in the scheduler.
     */
    pendingTasks: number;
}

/**
 * Props accepted by the <SchedulerCard> component.
 */
export interface SchedulerCardProps {
    /**
     * Status of the scheduler at time of the current request.
     */
    status: SchedulerStatus;
}

/**
 * The <SchedulerCard> component displays information on the Volunteer Manager scheduler.
 */
export function SchedulerCard(props: SchedulerCardProps) {
    const { executionCount, timeSinceLastExecutionMs } = props.status;
    const { invocationCount, timeSinceLastInvocationMs } = props.status;

    let lastExecutionTime: string | undefined;
    if (!!timeSinceLastExecutionMs) {
        const executionTime = Temporal.Now.zonedDateTimeISO('UTC').subtract({
            milliseconds: timeSinceLastExecutionMs
        });

        lastExecutionTime = formatDate(executionTime, 'YYYY-MM-DD [at] HH:mm:ss');
    }

    let lastInvocationTime: string | undefined;
    if (!!timeSinceLastInvocationMs) {
        const invocationTime = Temporal.Now.zonedDateTimeISO('UTC').subtract({
            milliseconds: timeSinceLastInvocationMs
        });

        lastInvocationTime = formatDate(invocationTime, 'YYYY-MM-DD [at] HH:mm:ss');
    }

    return (
        <Card>
            <CardMedia sx={{ aspectRatio: 2, backgroundPositionY: '75%' }}
                       image="/images/admin/scheduler-header.jpg" title="Scheduler" />
            <CardContent sx={{ pb: '8px !important' }}>
                <Typography variant="h5">
                    Scheduler status
                </Typography>
                { (!executionCount || !lastExecutionTime) &&
                    <Typography variant="body2" sx={{ py: 1 }}>
                        The scheduler is not currently running.
                    </Typography> }
                { (!!executionCount && !!lastExecutionTime) &&
                    <Typography variant="body2" sx={{ py: 1 }} suppressHydrationWarning>
                        Most recent scheduler run on {lastExecutionTime}; {executionCount} total
                        run{executionCount === 1 ? '' : 's'}.
                    </Typography> }
                { (!!invocationCount && !!lastInvocationTime) &&
                    <>
                        <Divider />
                        <Typography variant="body2" sx={{ py: 1 }} suppressHydrationWarning>
                            Last task invoked on {lastInvocationTime}; {invocationCount} total task
                            invocation{invocationCount === 1 ? '' : 's'},
                            {' '}{props.status.pendingTasks} tasks pending.
                        </Typography>
                    </> }
            </CardContent>
        </Card>
    )
}

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';

import { dayjs } from '@lib/DateTime';

/**
 * Formatter used to display the execution count number.
 */
const kExecutionCountFormatter = new Intl.NumberFormat('en-US');

/**
 * Representation of the status of the Volunteer Manager scheduler.
 */
export interface SchedulerStatus {
    /**
     * Number of times that the scheduler has been executed.
     */
    executionCount: number;

    /**
     * Number of milliseconds since the last execution of the scheduler.
     */
    timeSinceLastExecutionMs?: number;
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

    let lastExecutionTime: string | undefined;
    if (!!timeSinceLastExecutionMs) {
        const executionTime = dayjs().subtract(timeSinceLastExecutionMs, 'milliseconds');
        lastExecutionTime = executionTime.format('YYYY-MM-DD [at] HH:mm:ss');
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
                        {kExecutionCountFormatter.format(executionCount)} total executions. Last
                        execution happened on {lastExecutionTime}.
                    </Typography> }
            </CardContent>
        </Card>
    )
}

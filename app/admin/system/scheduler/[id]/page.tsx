// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { DetailedLogs } from '../../outbox/[id]/DetailedLogs';
import { GotoTaskButton } from './GotoTaskButton';
import { Privilege } from '@lib/auth/Privileges';
import { RerunTaskButton } from './RerunTaskButton';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import { dayjs } from '@lib/DateTime';
import db, { tTasks } from '@lib/database';

/**
 * The task page gives details about the execution of an individual task, including all logs, timing
 * and exception information. It allows system administrators to inspect what went wrong.
 */
export default async function TaskPage(props: NextRouterParams<'id'>) {
    if (!props.params.id)
        notFound();

    await requireAuthenticationContext({
        check: 'admin',
        privilege: Privilege.SystemAdministrator,
    });

    const task = await db.selectFrom(tTasks)
        .select({
            taskId: tTasks.taskId,
            taskDate: tTasks.taskScheduledDate,
            taskName: tTasks.taskName,
            taskParams: tTasks.taskParams,
            taskParentTaskId: tTasks.taskParentTaskId,
            taskInterval: tTasks.taskScheduledIntervalMs,

            result: tTasks.taskInvocationResult,
            resultLogs: tTasks.taskInvocationLogs,
            resultTimeMs: tTasks.taskInvocationTimeMs,
        })
        .where(tTasks.taskId.equals(parseInt(props.params.id, 10)))
        .executeSelectNoneOrOne();

    if (!task)
        notFound();

    const taskParamsObject = JSON.parse(task.taskParams);
    const taskParamsFormatted = JSON.stringify(taskParamsObject, undefined, /* space= */ 4);

    const taskLogs = !!task.resultLogs ? JSON.parse(task.resultLogs)
                                       : [ /* no log entries */ ];

    return (
        <>
            <Paper>
                <Typography sx={{ p: 2 }} variant="h5">
                    Scheduler task #{task.taskId} ({dayjs(task.taskDate).format('MMMM D, YYYY')})
                </Typography>
            </Paper>
            <TableContainer component={Paper} suppressHydrationWarning>
                <Table>
                    <TableRow>
                        <TableCell width="25%" component="th" scope="row">
                            Task name
                        </TableCell>
                        <TableCell>{task.taskName}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell width="25%" component="th" scope="row">
                            Task parameters
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                            {taskParamsFormatted}
                        </TableCell>
                    </TableRow>
                    { !!task.taskParentTaskId &&
                        <TableRow>
                            <TableCell width="25%" component="th" scope="row">
                                Task parent
                            </TableCell>
                            <TableCell>
                                <Tooltip title="Navigate to the parent task">
                                    <GotoTaskButton taskId={task.taskParentTaskId} />
                                </Tooltip>
                            </TableCell>
                        </TableRow> }
                    <TableRow>
                        <TableCell width="25%" component="th" scope="row">
                            Scheduled date
                        </TableCell>
                        <TableCell>{dayjs(task.taskDate).format('YYYY-MM-DD HH:mm:ss')}</TableCell>
                    </TableRow>
                    { !!task.taskInterval &&
                        <TableRow>
                            <TableCell width="25%" component="th" scope="row">
                                Scheduled interval
                            </TableCell>
                            <TableCell>{task.taskInterval}ms</TableCell>
                        </TableRow> }
                </Table>
            </TableContainer>
            { !!task.result &&
                <TableContainer component={Paper} suppressHydrationWarning>
                    <Table>
                        <TableRow>
                            <TableCell width="25%" component="th" scope="row">
                                Execution result
                            </TableCell>
                            <TableCell>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Typography variant="body2">
                                        {task.result}
                                    </Typography>
                                    <RerunTaskButton taskId={task.taskId} />
                                </Stack>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell width="25%" component="th" scope="row">
                                Execution runtime
                            </TableCell>
                            <TableCell>
                                {Math.round((task.resultTimeMs ?? 0) * 10) / 10}ms
                            </TableCell>
                        </TableRow>
                    </Table>
                </TableContainer> }
            { !!taskLogs.length && <DetailedLogs logs={taskLogs} /> }
        </>
    );
}

export const metadata: Metadata = {
    title: 'Task | AnimeCon Volunteer Manager',
};

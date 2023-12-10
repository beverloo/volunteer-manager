// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import LoadingButton from '@mui/lab/LoadingButton';
import Paper from '@mui/material/Paper';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { callApi } from '@lib/callApi';

/**
 * Props accepted by the <SchedulerCreateTaskPanel> component.
 */
interface SchedulerCreateTaskPanelProps {

}

/**
 * The <SchedulerCreateTaskPanel> component shows a paper listing each of the tasks known to the
 * scheduler, which can be created through a Web interface.
 */
export function SchedulerCreateTaskPanel(props: SchedulerCreateTaskPanelProps) {
    // TODO: Display a table or grid or form with the tasks that exist and can be created through
    // the interface. MVP w/ a text box for the settings might be sufficient.

    const [ error, setError ] = useState<string | undefined>();
    const [ resetLoading, setResetLoading ] = useState<boolean>(false);
    const router = useRouter();

    const handleReset = useCallback(async () => {
        setResetLoading(true);
        try {
            const result = await callApi('post', '/api/admin/scheduler', {
                taskName: 'PopulateSchedulerTask',
                delayMs: 0,
            });

            if (result.success) {
                router.refresh();
            } else {
                setError(
                    result.error ?? 'Unable to reset the scheduler, an unknown error occurred');
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setResetLoading(false);
        }
    }, [ router ]);

    return (
        <Paper sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="h5">
                    Schedule a new task
                </Typography>
                <LoadingButton color="warning" startIcon={ <RestartAltIcon /> } size="small"
                               loading={resetLoading} onClick={handleReset}>
                    Reset
                </LoadingButton>
            </Stack>
            <Collapse in={!!error}>
                <Alert severity="error">
                    {error}
                </Alert>
            </Collapse>
        </Paper>
    );
}

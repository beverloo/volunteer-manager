// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@mui/material/Button';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';

/**
 * Props accepted by the <GotoTaskButton> component.
 */
interface GotoTaskButtonProps {
    /**
     * Unique ID of the task that should be navigated to when activated.
     */
    taskId: number;
}

/**
 * The <GotoTaskButton> component displays a button that allows easy navigation to another task.
 */
export function GotoTaskButton(props: GotoTaskButtonProps) {
    const router = useRouter();

    const handleNavigate = useCallback(() => {
        router.push(`/admin/system/scheduler/${props.taskId}`);
    }, [ props.taskId, router ]);

    return (
        <Button size="small" variant="outlined" color="success" onClick={handleNavigate}>
            <KeyboardDoubleArrowRightIcon fontSize="small" />
        </Button>
    );
}

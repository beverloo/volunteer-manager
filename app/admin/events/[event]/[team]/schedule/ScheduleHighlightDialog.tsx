// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useMemo, useState } from 'react';

import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { GetScheduleResult } from '@app/api/admin/event/schedule/getSchedule';

/**
 * Props accepted by the <ScheduleHighlightDialog> component.
 */
interface ScheduleHighlightDialogProps {
    /**
     * Comma-separated string of the shifts that have been highlighted, if any.
     */
    highlighted?: string;

    /**
     * Whether shifts from other teams should be displayed in the dialog.
     */
    inclusiveShifts?: boolean;

    /**
     * The full set of shifts that should be displayed in the dialog.
     */
    shifts: GetScheduleResult['metadata']['shifts'];

    /**
     * Callback that should be invoked when the status for a shift is being changed.
     */
    onChange?: (shiftId: number) => Promise<void>;

    /**
     * Callback that should be invoked when the dialog is requested to be closed.
     */
    onClose?: () => void;
}

/**
 * The <ScheduleHighlightDialog> component displays a dialog with the available shifts that can be
 * highlighted on the schedule. It includes focused metadata to inform the leader of the shifts
 * where additional scheduling work is still expected.
 */
export function ScheduleHighlightDialog(props: ScheduleHighlightDialogProps) {
    const [ isUpdating, setIsUpdating ] = useState<boolean>(false);

    const highlightedSet = useMemo(() => {
        return !!props.highlighted ? new Set(props.highlighted.split(',').map(v => parseInt(v)))
                                   : new Set();

    }, [ props.highlighted ]);

    // ---------------------------------------------------------------------------------------------

    const handleUpdate = useCallback(async (shiftId: number) => {
        setIsUpdating(true);
        try {
            if (!!props.onChange)
                await props.onChange(shiftId);

        } catch (error: any) {
            console.error(`Unable to change the highlighted shifts: ${error}`);
        } finally {
            setIsUpdating(false);
        }
    }, [ props.onChange ]);

    // ---------------------------------------------------------------------------------------------

    // TODO: Highlight which team owns the shift
    // TODO: Highlight which shifts haven't been completely scheduled yet

    return (
        <Dialog open fullWidth onClose={props.onClose}>
            <DialogTitle>
                <Stack direction="row" spacing={2} alignItems="center"
                       justifyContent="space-between">
                    <Typography variant="inherit">
                        Shifts to highlight
                    </Typography>
                    { isUpdating && <CircularProgress color="error" size="1em" /> }
                </Stack>
            </DialogTitle>
            <DialogContent>
                <FormGroup>
                    { props.shifts.map(shift => {
                        if (!shift.localTeam && !props.inclusiveShifts) return undefined;

                        const callback = handleUpdate.bind(null, shift.id);
                        const checked = highlightedSet.has(shift.id);

                        return (
                            <FormControlLabel key={shift.id}
                                                control={
                                                    <Checkbox checked={checked} size="small"
                                                              onClick={callback}/>
                                                }
                                                label={shift.label} />
                        );
                    } )}
                </FormGroup>
            </DialogContent>
            <DialogActions sx={{ pt: 0, mr: 1, mb: 0 }}>
                <Button onClick={props.onClose} variant="text">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

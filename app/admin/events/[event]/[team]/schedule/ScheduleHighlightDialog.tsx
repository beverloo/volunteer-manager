// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useMemo } from 'react';

import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
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
    const highlightedSet = useMemo(() => {
        return !!props.highlighted ? new Set(props.highlighted.split(',').map(v => parseInt(v)))
                                   : new Set();

    }, [ props.highlighted ]);

    // TODO: Highlight which team owns the shift
    // TODO: Highlight which shifts haven't been completely scheduled yet
    // TODO: Spinner when the selection is still being updated

    return (
        <Dialog open fullWidth onClose={props.onClose}>
            <DialogTitle>Shifts to highlight</DialogTitle>
            <DialogContent>
                <FormGroup>
                    { props.shifts.map(shift => {
                        if (!shift.localTeam && !props.inclusiveShifts) return undefined;

                        const callback = props.onChange?.bind(null, shift.id);
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

// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useContext, useMemo, useState } from 'react';

import { SelectElement } from 'react-hook-form-mui';

import type { PopoverPosition } from '@mui/material/Popover';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';

import type { ScheduleEvent, ScheduleEventMutation, ScheduleMarker, ScheduleResource }
    from '@app/admin/components/Schedule';

import { ScheduleContext } from './ScheduleContext';
import { Schedule } from '@app/admin/components/Schedule';
import { SettingDialog } from '@app/admin/components/SettingDialog';

/**
 * Background color to issue to markers on the schedule, depending on what they represent.
 */
const kMarkerBackgroundColor = {
    avoid: '#ffe082',
    unavailable: '#eceff1',
};

/**
 * Props accepted by the <ScheduleImpl> component.
 */
export interface ScheduleImplProps {
    /**
     * Whether the schedule should be displayed in read-only mode.
     */
    readOnly?: boolean;
}

/**
 * The <ScheduleImpl> component displays the actual volunteering schedule. It uses a scheduling
 * component from our calendar library, and shows all the volunteers and shifts in chronological
 * order. Furthermore, it supports all filtering options elsewhere in the user interface.
 */
export function ScheduleImpl(props: ScheduleImplProps) {
    const { readOnly } = props;

    const context = useContext(ScheduleContext);

    // ---------------------------------------------------------------------------------------------
    // Compose the resources that should be shown on the schedule
    // ---------------------------------------------------------------------------------------------

    const { events, markers, resources } = useMemo(() => {
        const events: ScheduleEvent[] = [];
        const markers: ScheduleMarker[] = [];
        const resources: ScheduleResource[] = [];

        if (!!context.schedule) {
            for (const marker of context.schedule.markers) {
                markers.push({
                    ...marker,
                    background: kMarkerBackgroundColor[marker.type],
                });
            }

            for (const resource of context.schedule.resources) {
                resources.push({
                    ...resource,
                    eventCreation: false,
                    name: `${resource.name} (${resource.children.length})`,
                });
            }

            for (const shift of context.schedule.shifts)
                events.push(shift);
        }

        return { events, markers, resources };

    }, [ context.schedule ])

    const { recentShifts, shifts } = useMemo(() => {
        const recentShifts: { id: number; label: string; color: string }[] = [];
        const shifts: { id: number; label: string; color: string }[] = [];

        if (!!context.schedule) {
            for (const shiftId of context.schedule.metadata.recent) {
                const shift = context.schedule.metadata.shifts.find(v => v.id === shiftId);
                if (!shift)
                    continue;  // the |shift| no longer exists

                recentShifts.push(shift);
            }

            for (const shift of context.schedule.metadata.shifts) {
                if (!context.inclusiveShifts && !shift.localTeam)
                    continue;  // ignore this shift

                shifts.push(shift);
            }
        }

        return { recentShifts, shifts };

    }, [ context.inclusiveShifts, context.schedule ]);

    // ---------------------------------------------------------------------------------------------
    // Interaction: double click -> shift settings dialog
    // ---------------------------------------------------------------------------------------------

    type DialogResolver = undefined | ((mutation?: ScheduleEventMutation) => void);

    const [ dialogEvent, setDialogEvent ] = useState<ScheduleEvent | undefined>();
    const [ dialogResolver, setDialogResolver ] = useState<DialogResolver>();

    const handleDialogClose = useCallback(() => {
        setDialogEvent(undefined);
        if (!!dialogResolver)
            dialogResolver(/* do nothing */);

    }, [ dialogResolver ]);

    const handleDialogDelete = useCallback(async () => {
        if (!dialogEvent || !dialogResolver)
            return { error: <>I forgot which shift was selected, sorry!</> };

        dialogResolver({ delete: true });
        return { close: true } as const;

    }, [ dialogEvent, dialogResolver ]);

    const handleDialogUpdate = useCallback(async (event: ScheduleEvent) => {
        if (!dialogEvent || !dialogResolver)
            return { error: <>I forgot which shift was selected, sorry!</> };

        for (const shift of shifts) {
            if (shift.id !== event.shiftId)
                continue;

            setDialogEvent(undefined);
            dialogResolver({
                update: {
                    ...event,
                    shiftId: shift.id,
                    title: shift.label,
                    color: shift.color,
                }
            });

            return { close: true } as const;
        }

        return { error: <>You need to select a shift to assign them to!</> };

    }, [ dialogEvent, dialogResolver, shifts ]);

    const handleDoubleClick = useCallback(async (event: ScheduleEvent) => {
        return new Promise<ScheduleEventMutation | undefined>(resolve => {
            setDialogEvent(event);
            setDialogResolver(() => resolve);
        });
    }, [ /* no dependencies */ ]);

    // ---------------------------------------------------------------------------------------------
    // Interaction: right click -> recent shift context menu
    // ---------------------------------------------------------------------------------------------

    type ContextMenuResolver = undefined | ((mutation?: ScheduleEventMutation) => void);

    const [ contextMenuEvent, setContextMenuEvent ] = useState<ScheduleEvent | undefined>();
    const [ contextMenuPosition, setContextMenuPosition ] = useState<PopoverPosition | undefined>();
    const [ contextMenuResolver, setContextMenuResolver ] = useState<ContextMenuResolver>();

    const handleRightClickMenuSelect = useCallback((shiftId: number) => {
        if (!contextMenuEvent || !contextMenuResolver)
            return;

        for (const shift of shifts) {
            if (shift.id !== shiftId)
                continue;

            contextMenuResolver({
                update: {
                    ...contextMenuEvent,
                    shiftId: shift.id,
                    title: shift.label,
                    color: shift.color,
                }
            });
        }

        setContextMenuEvent(undefined);

    }, [ contextMenuEvent, contextMenuResolver, shifts ]);

    const handleRightClickMenuClose = useCallback(() => {
        setContextMenuEvent(undefined);
        if (!!contextMenuResolver)
            contextMenuResolver(/* do nothing */);

    }, [ contextMenuResolver ]);

    const handleRightClick = useCallback(
        async (event: ScheduleEvent, domEvent: React.MouseEvent<HTMLElement>) => {
            return new Promise<ScheduleEventMutation | undefined>(resolve => {
                setContextMenuEvent(event);
                setContextMenuPosition({
                    top: domEvent.clientY,
                    left: domEvent.clientX,
                });

                setContextMenuResolver(() => resolve);
            });

        }, [ /* no dependencies */ ]);

    // ---------------------------------------------------------------------------------------------

    if (!context.schedule || !resources.length) {
        return (
            <Paper sx={{ p: 2 }}>
                <Skeleton animation="wave" height={12} width="91%" />
                <Skeleton animation="wave" height={12} width="98%" />
                <Skeleton animation="wave" height={12} width="93%" />
                <Skeleton animation="wave" height={12} width="85%" />
            </Paper>
        );
    }

    const eventDefaults: Partial<ScheduleEvent> = {
        title: 'Unscheduled',
        color: '#760707',
    }

    return (
        <Paper>
            <Schedule min={context.schedule.min} max={context.schedule.max} readOnly={readOnly}
                      events={events} eventDefaults={eventDefaults} eventOverlap={false}
                      onChange={context.processMutation} onRightClick={handleRightClick}
                      onDoubleClick={handleDoubleClick} markers={markers} resources={resources}
                      displayTimezone={context.schedule.timezone} subject="shift" />
            <SettingDialog title="Select a shift" delete open={!!dialogEvent}
                           onClose={handleDialogClose} onDelete={handleDialogDelete}
                           onSubmit={handleDialogUpdate} defaultValues={ dialogEvent ?? {} }>
                <SelectElement name="shiftId" options={shifts} size="small" fullWidth />
            </SettingDialog>
            <Menu open={!!contextMenuEvent && !!recentShifts.length}
                  onClose={handleRightClickMenuClose}
                  anchorReference="anchorPosition"
                  anchorPosition={contextMenuPosition}>
                { recentShifts.map(shift =>
                    <MenuItem key={shift.id} onClick={ () => handleRightClickMenuSelect(shift.id) }>
                        {shift.label}
                    </MenuItem> )}
            </Menu>
        </Paper>
    );
}

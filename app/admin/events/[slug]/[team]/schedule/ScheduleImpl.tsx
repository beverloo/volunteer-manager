// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useContext, useMemo, useState } from 'react';

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

    // ---------------------------------------------------------------------------------------------

    type DialogResolver = undefined | ((mutation?: ScheduleEventMutation) => void);

    const [ dialogEvent, setDialogEvent ] = useState<ScheduleEvent | undefined>();
    const [ dialogResolver, setDialogResolver ] = useState<DialogResolver>();

    // TODO: Populate a list of shifts that can be selected
    // TODO: Hook up updates in the `handleDialogUpdate` callback

    const handleDialogClose = useCallback(() => {
        setDialogEvent(undefined);
        if (!!dialogResolver)
            dialogResolver(/* do nothing */);

    }, [ dialogResolver ]);

    const handleDialogDelete = useCallback(async () => {
        console.log(dialogEvent, dialogResolver);
        if (!dialogEvent || !dialogResolver)
            return { error: <>I forgot which shift was selected, sorry!</> };

        dialogResolver({ delete: true });
        return { close: true } as const;

    }, [ dialogEvent, dialogResolver ]);

    const handleDialogUpdate = useCallback(async (event: ScheduleEvent) => {
        return { error: 'Not yet implemented' };

    }, [ dialogEvent ]);

    const handleDoubleClick = useCallback(async (event: ScheduleEvent) => {
        return new Promise<ScheduleEventMutation | undefined>(resolve => {
            setDialogEvent(event);
            setDialogResolver(() => resolve);
        });
    }, [ /* no dependencies */ ]);

    // ---------------------------------------------------------------------------------------------

    type ContextMenuResolver = undefined | ((mutation?: ScheduleEventMutation) => void);

    const [ contextMenuEvent, setContextMenuEvent ] = useState<ScheduleEvent | undefined>();
    const [ contextMenuPosition, setContextMenuPosition ] = useState<PopoverPosition | undefined>();
    const [ contextMenuResolver, setContextMenuResolver ] = useState<ContextMenuResolver>();

    // TODO: Populate a list of the most recent selected shifts
    // TODO: Hook up selecting a particular shift to udpate the `contextMenuEvent` to

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
                <em>Shift selection dialog will show up here</em>
            </SettingDialog>
            <Menu open={!!contextMenuEvent}
                  onClose={handleRightClickMenuClose}
                  anchorReference="anchorPosition"
                  anchorPosition={contextMenuPosition}>
                <MenuItem>Recent shift #1</MenuItem>
                <MenuItem>Recent shift #2</MenuItem>
                <MenuItem>Recent shift #3</MenuItem>
                <MenuItem>Recent shift #4</MenuItem>
            </Menu>
        </Paper>
    );
}

// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useFormContext } from '@proxy/react-hook-form-mui';

import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Tooltip from '@mui/material/Tooltip';

import { dayjs } from '@lib/DateTime';

/**
 * Props accepted by the <EventTeamSettingsIndicator> component.
 */
export interface EventTeamSettingsIndicatorProps {
    /**
     * Names of the fields, both the start and end of the window, that should be observed in order
     * to determine whether the window is currently active or not.
     */
    fields: {
        start: string;
        end: string;
    };
}

/**
 * The <EventTeamSettingsIndicator> component displays an icon, with a tooltip, illustrating whether
 * the availability window is currently published, or at what point it will be.
 */
export function EventTeamSettingsIndicator(props: EventTeamSettingsIndicatorProps) {
    const { watch } = useFormContext();
    const values = watch([ props.fields.start, props.fields.end ]);

    if (!values || values.length !== 2) {
        return (
            <Tooltip title="Unable to determine the current state...">
                <CancelIcon color="disabled" fontSize="small" />
            </Tooltip>
        );
    }

    if (!!values[0] && !dayjs.isDayjs(values[0]))
        return undefined;  // this case shouldn't happen
    if (!!values[1] && !dayjs.isDayjs(values[1]))
        return undefined;  // this case shouldn't happen

    const start = values[0] ? (values[0] as dayjs.Dayjs).utc() : undefined;
    const end = values[1] ? (values[1] as dayjs.Dayjs).utc() : undefined;

    const now = dayjs.utc();

    if (!!start && !!end) {
        // Both the start and end date have been given.
        if (start > now) {
            return (
                <Tooltip title="Not published, the start date is in the future">
                    <CancelIcon color="error" fontSize="small" />
                </Tooltip>
            );
        } else if (end <= now) {
            return (
                <Tooltip title="Not published, the end date has passed">
                    <CancelIcon color="error" fontSize="small" />
                </Tooltip>
            );
        } else {
            return (
                <Tooltip title="Published, will unpublish at the end date">
                    <CheckCircleIcon color="success" fontSize="small" />
                </Tooltip>
            );
        }
    } else if (!!end) {
        // Only an end date has been given.
        if (end > now) {
            return (
                <Tooltip title="Published, since the creation of this event">
                    <CheckCircleIcon color="success" fontSize="small" />
                </Tooltip>
            );
        } else {
            return (
                <Tooltip title="Not published, the end date has passed">
                    <CancelIcon color="error" fontSize="small" />
                </Tooltip>
            );
        }
    } else if (!!start) {
        // Only a start date has been given.
        if (start < now) {
            return (
                <Tooltip title="Published, will not automatically unpublish">
                    <CheckCircleIcon color="success" fontSize="small" />
                </Tooltip>
            );
        } else {
            return (
                <Tooltip title="Not published, the start date is in the future">
                    <CancelIcon color="error" fontSize="small" />
                </Tooltip>
            );
        }
    } else {
        // Neither a start nor an end date has been given.
        return (
            <Tooltip title="Not published, configuration is missing">
                <CancelIcon color="error" fontSize="small" />
            </Tooltip>
        );
    }
}

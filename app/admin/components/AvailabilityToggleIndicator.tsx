// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useFormContext } from '@proxy/react-hook-form-mui';

import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Tooltip from '@mui/material/Tooltip';

/**
 * Props accepted by the <AvailabilityToggleIndicator> component.
 */
export interface AvailabilityToggleIndicatorProps {
    /**
     * Names of the fields that should be observed in order to determine whether the setting is
     * currently marked as available.
     */
    field: string;
}

/**
 * The <AvailabilityToggleIndicator> component displays an icon, with a tooltip, visualising whether
 * the availability toggle is currently published or not.
 */
export function AvailabilityToggleIndicator(props: AvailabilityToggleIndicatorProps) {
    const { watch } = useFormContext();

    const value = watch(props.field);
    if (!value) {
        return (
            <Tooltip title="Not published to everyone">
                <CancelIcon color="error" fontSize="small" />
            </Tooltip>
        );
    } else {
        return (
            <Tooltip title="Published to everyone">
                <CheckCircleIcon color="success" fontSize="small" />
            </Tooltip>
        );
    }
}

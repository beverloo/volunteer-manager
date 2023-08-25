// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import InfoIcon from '@mui/icons-material/Info';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon';

import { RoleBadge as VolunteerBadgeVariant } from '@lib/database/Types';

/**
 * Types of volunteer badge that can be assigned to individuals.
 */
export { VolunteerBadgeVariant };

/**
 * Props accepted by the <VolunteerBadge> component.
 */
export interface VolunteerBadgeProps extends SvgIconProps {
    /**
     * Variant of volunteer badge that should be displayed.
     */
    variant: keyof typeof VolunteerBadgeVariant;
}

/**
 * The <VolunteerBadge> component is one of the available volunteer badges identified by the
 * "variant" prop. It matches the interface of <SvgIcon> beyond that.
 */
export function VolunteerBadge(props: VolunteerBadgeProps) {
    switch (props.variant) {
        case VolunteerBadgeVariant.Host:
            return <InfoIcon {...props} color="info" />;
        case VolunteerBadgeVariant.Senior:
            return <KeyboardArrowUpIcon {...props} />;
        case VolunteerBadgeVariant.Staff:
            return <KeyboardDoubleArrowUpIcon {...props} />;
    }

    return <SvgIcon {...props} />
};

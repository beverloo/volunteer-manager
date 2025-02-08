// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import InfoIcon from '@mui/icons-material/Info';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon';

import { type RoleBadge, kRoleBadge } from '@lib/database/Types';

/**
 * Props accepted by the <VolunteerBadge> component.
 */
interface VolunteerBadgeProps extends SvgIconProps {
    /**
     * Variant of volunteer badge that should be displayed.
     */
    variant: RoleBadge;
}

/**
 * The <VolunteerBadge> component is one of the available volunteer badges identified by the
 * "variant" prop. It matches the interface of <SvgIcon> beyond that.
 */
export function VolunteerBadge(props: VolunteerBadgeProps) {
    switch (props.variant) {
        case kRoleBadge.Host:
            return <InfoIcon {...props} color="info" />;
        case kRoleBadge.Senior:
            return <KeyboardArrowUpIcon {...props} />;
        case kRoleBadge.Staff:
            return <KeyboardDoubleArrowUpIcon {...props} />;
    }

    return <SvgIcon {...props} />
};

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import { default as MuiLink } from '@mui/material/Link';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import { RegistrationStatus } from '@lib/database/Types';
import { Avatar } from '@components/Avatar';

/**
 * Props accepted by the <EventRecentChanges> component.
 */
export interface EventRecentChangesProps {

}

/**
 * The <EventRecentChanges> component displays changes that were recently made by volunteers in
 * context of this event, such as sharing their preferences. Only a few highlights are shown.
 */
export function EventRecentChanges(props: EventRecentChangesProps) {
    return (
        <Card sx={{ minHeight: '100%' }}>
            <CardContent sx={{ pb: '16px !important' }}>
                TODO
            </CardContent>
        </Card>
    );
}

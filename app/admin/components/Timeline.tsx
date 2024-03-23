// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useTheme } from '@mui/material/styles';

import { Temporal } from '@lib/Temporal';
import { Timeline as TimelineInternal } from '@beverloo/volunteer-manager-timeline';

import type { TimelineEvent, TimelineEventMutation, TimelineProps as TimelineInternalProps }
    from '@beverloo/volunteer-manager-timeline';

import '@beverloo/volunteer-manager-timeline/dist/volunteer-manager-timeline.css';

/**
 * Re-export the types exposed by the internal implementation.
 */
export type { TimelineEvent, TimelineEventMutation };

/**
 * Props accepted by the <Timeline> event.
 */
export type TimelineProps = Omit<TimelineInternalProps, 'dataTimezone' | 'temporal' | 'theme'>;

/**
 * The <Timeline> component is a generic timeline that supports both mutable and immutable entries,
 * each of which enjoys individual timing. It's a generic component without any specific purpose,
 * whose styling will adjust based on configuration.
 */
export function Timeline(props: TimelineProps) {
    const theme = useTheme();
    return <TimelineInternal {...props} dataTimezone="utc" temporal={Temporal}
                             theme={theme.palette.mode} />;
}

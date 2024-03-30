// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type React from 'react';

import type { SystemStyleObject, Theme } from '@mui/system';
import Stack from '@mui/material/Stack';

import { ScheduleContextManager } from './ScheduleContextManager';
import { ScheduleTheme } from './ScheduleTheme';
import { determineEnvironment } from '@lib/Environment';
import { ApplicationBar } from './components/ApplicationBar';

import { kDesktopMaximumWidthPx, kDesktopMenuWidthPx } from './Constants';

/**
 * Styling rules used for <ScheduleLayout> and friends.
 */
const kStyles: Record<string, SystemStyleObject<Theme>> = {
    container: {
        margin: 'auto',
        maxWidth: {
            md: kDesktopMaximumWidthPx,
        },
        paddingRight: {
            md: 2,
        }
    },

    content: {
        flexGrow: 1,
        maxWidth: '100%',
        width: {
            md: `calc(100% - ${2 * kDesktopMenuWidthPx}px)`,
        },
    },
};

/**
 * The <ScheduleLayout> component is the main page of the scheduling tool, that allows volunteers to
 * access both their schedule and the program of the entire event. The layout supports both light
 * and dark mode, and is accessible on both desktop and mobile devices.
 */
export default async function ScheduleLayout(props: React.PropsWithChildren) {
    const environment = await determineEnvironment();

    return (
        <ScheduleTheme>
            <ScheduleContextManager>
                <ApplicationBar />
                <Stack direction="row" sx={kStyles.container}>
                    { /* TODO: Desktop navigation */ }
                    <Stack direction="column" spacing={2} sx={kStyles.content}>
                        {props.children}
                    </Stack>
                </Stack>
                { /* TODO: Mobile navigation */ }
            </ScheduleContextManager>
        </ScheduleTheme>
    );
}

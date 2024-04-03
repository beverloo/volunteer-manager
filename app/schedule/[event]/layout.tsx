// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type React from 'react';
import { notFound } from 'next/navigation';

import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { ScheduleContextManager } from './ScheduleContextManager';
import { ScheduleTheme } from './ScheduleTheme';
import { determineEnvironment } from '@lib/Environment';
import { ApplicationBar } from './components/ApplicationBar';

import { kDesktopMaximumWidthPx, kDesktopMenuWidthPx } from './Constants';
import { DesktopNavigation } from './components/DesktopNavigation';
import { MobileNavigation } from './components/MobileNavigation';
import { getEventBySlug } from '@lib/EventLoader';

/**
 * Styling rules used for <ScheduleLayout> and friends.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
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
        padding: 2,
    },
};

/**
 * Props accepted by the <ScheduleLayout> component.
 */
export interface ScheduleLayoutProps {
    /**
     * Parameters passed to the component by the NextJS router.
     */
    params: {
        /**
         * The slug included in the URL. Used to uniquely identify the event.
         */
        event: string;
    },
}

/**
 * The <ScheduleLayout> component is the main page of the scheduling tool, that allows volunteers to
 * access both their schedule and the program of the entire event. The layout supports both light
 * and dark mode, and is accessible on both desktop and mobile devices.
 */
export default async function ScheduleLayout(props: React.PropsWithChildren<ScheduleLayoutProps>) {
    const { params } = props;

    const environment = await determineEnvironment();
    const event = await getEventBySlug(params.event);
    if (!event)
        notFound();

    // TODO: Use `environment` to customise the `<ScheduleTheme>`

    return (
        <ScheduleTheme>
            <ScheduleContextManager event={event.slug}>
                <ApplicationBar />
                <Stack direction="row" sx={kStyles.container}>
                    <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                        <DesktopNavigation />
                    </Box>
                    <Stack direction="column" spacing={2} sx={kStyles.content}>
                        {props.children}
                    </Stack>
                </Stack>
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                    <MobileNavigation />
                </Box>
            </ScheduleContextManager>
        </ScheduleTheme>
    );
}

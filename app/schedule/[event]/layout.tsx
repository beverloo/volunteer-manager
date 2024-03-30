// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type React from 'react';

import Container from '@mui/material/Container';

import { determineEnvironment } from '@lib/Environment';

/**
 * The <ScheduleLayout> component is the main page of the scheduling tool, that allows volunteers to
 * access both their schedule and the program of the entire event. The layout supports both light
 * and dark mode, and is accessible on both desktop and mobile devices.
 */
export default async function ScheduleLayout(props: React.PropsWithChildren) {
    const environment = await determineEnvironment();

    return (
        <Container disableGutters maxWidth={false} sx={{ height: '100vh',
                                                         backgroundColor: '#eff6ff' }}>
            <h1>{environment?.environmentName}</h1>
            {props.children}
        </Container>
    );
}

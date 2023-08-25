// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Masonry from '@mui/lab/Masonry';

import type { DatabaseStatus } from './DatabaseCard';
import { type Birthday, BirthdayCard } from './BirthdayCard';
import { DatabaseCard } from './DatabaseCard';

/**
 * Props accepted by the <Dashboard> component.
 */
export interface DashboardProps {
    /**
     * The birthdays that happen in the current month.
     */
    currentBirthdays: Birthday[];

    /**
     * Status of the database connection during the current load. Optional.
     */
    databaseStatus?: DatabaseStatus;

    /**
     * The birthdays that happen in the upcoming month.
     */
    upcomingBirthdays: Birthday[];
}

/**
 * The <Dashboard> component encapsulates all the cards that could be shown on the Volunteer
 * Manager dashboard, and composes them in a grid using the MUI Masonry component.
 */
export function Dashboard(props: DashboardProps) {
    return (
        <Masonry columns={4} spacing={2} sx={{ mt: '-8px !important', ml: '-8px !important' }}>
            { !!props.currentBirthdays.length &&
                <BirthdayCard birthdays={props.currentBirthdays} /> }
            { !!props.upcomingBirthdays.length &&
                <BirthdayCard upcoming birthdays={props.upcomingBirthdays} /> }
            { props.databaseStatus && <DatabaseCard status={props.databaseStatus} /> }
        </Masonry>
    );
}

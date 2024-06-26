// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Masonry from '@mui/lab/Masonry';

import type { DatabaseStatus } from './DatabaseCard';
import { AccessibleEventCard, type AccessibleEvent } from './AccessibleEventCard';
import { BirthdayCard, type Birthday } from './BirthdayCard';
import { DatabaseCard } from './DatabaseCard';
import { SchedulerCard, type SchedulerStatus } from './SchedulerCard';

/**
 * Props accepted by the <Dashboard> component.
 */
interface DashboardProps {
    /**
     * Entry for each of the accessible events that should be displayed, if any.
     */
    accessibleEvents: AccessibleEvent[];

    /**
     * The birthdays that happen in the current month.
     */
    currentBirthdays: Birthday[];

    /**
     * Status of the database connection during the current load. Optional.
     */
    databaseStatus?: DatabaseStatus;

    /**
     * Status of the scheduler at time of the current request.
     */
    schedulerStatus?: SchedulerStatus;

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
            { props.accessibleEvents.map((accessibleEvent, index) =>
                <AccessibleEventCard key={index} accessibleEvent={accessibleEvent} /> )}
            { props.databaseStatus && <DatabaseCard status={props.databaseStatus} /> }
            { props.schedulerStatus && <SchedulerCard status={props.schedulerStatus} /> }
        </Masonry>
    );
}

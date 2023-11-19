// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import { Suspense } from 'react';

import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';

import { AnimeConStreamingApiPlaceholder } from './AnimeConStreamingApiPlaceholder';
import { AnimeConStreamingApiResult } from './AnimeConStreamingApiResult';
import { PaperHeader } from '@app/admin/components/PaperHeader';

/**
 * The AnimeCon integration page is able to issue various API calls for illustrative debugging
 * purposes. The API call responses are displayed in text areas for manual consumption.
 */
export default async function AnimeConIntegrationPage() {
    return (
        <>
            <Paper sx={{ p: 2 }}>
                <PaperHeader title="AnimeCon Integration" />
                <Alert severity="info" sx={{ mt: 1 }}>
                    This page displays the results of the AnimeCon API calls. Responses will be
                    shown as they become available.
                </Alert>
            </Paper>
            <Paper sx={{ p: 2 }}>
                <PaperHeader title="Activities" subtitle="activities.json" sx={{ mb: 1 }} />
                <Suspense fallback={ <AnimeConStreamingApiPlaceholder /> }>
                    <AnimeConStreamingApiResult endpoint="activities.json" />
                </Suspense>
            </Paper>
            <Paper sx={{ p: 2 }}>
                <PaperHeader title="Activity Types" subtitle="activity-types.json" sx={{ mb: 1 }} />
                <Suspense fallback={ <AnimeConStreamingApiPlaceholder /> }>
                    <AnimeConStreamingApiResult endpoint="activity-types.json" />
                </Suspense>
            </Paper>
            <Paper sx={{ p: 2 }}>
                <PaperHeader title="Floors" subtitle="floors.json" sx={{ mb: 1 }} />
                <Suspense fallback={ <AnimeConStreamingApiPlaceholder /> }>
                    <AnimeConStreamingApiResult endpoint="floors.json" />
                </Suspense>
            </Paper>
            <Paper sx={{ p: 2 }}>
                <PaperHeader title="Timeslots" subtitle="timeslots.json" sx={{ mb: 1 }} />
                <Suspense fallback={ <AnimeConStreamingApiPlaceholder /> }>
                    <AnimeConStreamingApiResult endpoint="timeslots.json" />
                </Suspense>
            </Paper>
        </>
    );
}

export const metadata: Metadata = {
    title: 'AnimeCon integration | AnimeCon Volunteer Manager',
};

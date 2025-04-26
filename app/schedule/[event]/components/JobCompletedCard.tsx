// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

/**
 * The <JobCompletedCard> displays a card that celebrates that the volunteer has no further work to
 * do, and that they've helped out tremendously well.
 */
export function JobCompletedCard() {
    return (
        <Card>
            <Box sx={{
                backgroundImage: 'url(/images/job-completed.jpg?2025)',
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                aspectRatio: 3.5 }} />
            <CardContent sx={{ pb: '16px !important' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    <strong>You have completed all your shifts</strong>! Thank you so much for
                    helping us out with this AnimeCon festival, and we hope to see you again next
                    year!
                </Typography>
            </CardContent>
        </Card>
    );
}

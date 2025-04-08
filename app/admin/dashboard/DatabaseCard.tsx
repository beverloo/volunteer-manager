// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

/**
 * Representation of the status of the database connection.
 */
export interface DatabaseStatus {
    /**
     * Information about the connections handled by this database.
     */
    connections: {
        /**
         * Number of currently active connections.
         */
        active: number;

        /**
         * Number of currently idle connections.
         */
        idle: number;

        /**
         * Number of total connections that exist at the moment.
         */
        total: number;
    };

    /**
     * Number of actions that are currently pending in the task queue.
     */
    taskQueueSize: number;
}

/**
 * Props accepted by the <DatabaseCard> component.
 */
interface DatabaseCardProps {
    /**
     * Status of the database connection during the current request.
     */
    status: DatabaseStatus;
}

/**
 * The <DatabaseCard> component displays information on the database performance on the dashboard.
 */
export function DatabaseCard(props: DatabaseCardProps) {
    const { connections, taskQueueSize } = props.status;

    return (
        <Card>
            <CardMedia sx={{ aspectRatio: 2, backgroundPositionY: '75%' }}
                       image="/images/admin/database-header.jpg" title="Birthdays" />
            <CardContent sx={{ pb: '8px !important' }}>
                <Typography variant="h5" sx={{ pb: 1 }}>
                    Database status
                </Typography>
                <Grid container spacing={2} sx={{ pt: 1, mb: 0 }}>
                    <Grid size={{ xs: 9 }}>Active connections:</Grid>
                    <Grid size={{ xs: 3 }}>{connections.active}</Grid>

                    <Grid size={{ xs: 9 }}>Idle connections:</Grid>
                    <Grid size={{ xs: 3 }}>{connections.idle}</Grid>

                    <Grid size={{ xs: 9 }}>Total connections:</Grid>
                    <Grid size={{ xs: 3 }}>{connections.total}</Grid>

                    <Grid size={{ xs: 9 }}>Task queue size:</Grid>
                    <Grid size={{ xs: 3 }}>{taskQueueSize}</Grid>
                </Grid>
            </CardContent>
        </Card>
    )
}

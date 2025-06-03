// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { ApplicationAvailabilityForm } from '../../ApplicationParticipation';

/**
 * Props accepted by the <AvailabilityPreferencesForm> component.
 */
interface AvailabilityPreferencesFormProps {
    /**
     * Whether the form should be marked as read-only, useful in case their preferences have been
     * locked in ahead of scheduling.
     */
    readOnly?: boolean;
}

/**
 * The <AvailabilityPreferencesForm> component displays the form through which volunteers can
 * indicate their preferences regarding when they'll be around to help out.
 */
export function AvailabilityPreferencesForm(props: AvailabilityPreferencesFormProps) {
    const { readOnly } = props;

    return (
        <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
                <Typography variant="h5" sx={{ mb: -1 }}>
                    What are your preferences?
                </Typography>
            </Grid>

            { readOnly &&
                <Grid size={{ xs: 12 }}>
                    <Alert severity="warning">
        	            We've started drafting your schedule, and your preferences have been locked
                        in. Please e-mail us for any further changes!
                    </Alert>
                </Grid> }

            <ApplicationAvailabilityForm includeDietaryRestrictions />

            { /* TODO: Events they would like to participate in */ }

        </Grid>
    );
}

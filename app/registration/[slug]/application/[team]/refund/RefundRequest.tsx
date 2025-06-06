// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { RefundRequestForm } from './RefundRequestForm';

/**
 * Props accepted by the <RefundRequest> component.
 */
interface RefundRequestProps {
    /**
     * Whether the form should be marked as read-only, useful in case their refund has been issued.
     */
    readOnly?: boolean;
}

/**
 * The <RefundRequest> component will allow a volunteer to see and modify their ticket refund
 * request right from the portal. A form is used that's shared with the admin area.
 */
export function RefundRequest(props: RefundRequestProps) {
    const { readOnly } = props;

    return (
        <Box sx={{ mt: 1 }}>

            <Typography variant="h5">
                Request a ticket refund
            </Typography>

            { readOnly &&
                <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
                    Great news! Your request has been received, so your preferences have been locked
                    in. Please e-mail us for any further changes!
                </Alert> }

            { !readOnly &&
                <Typography sx={{ mt: 1, mb: 2 }}>
                    Your ticket number can be found in the confirmation e-mail you received when
                    you purchased it. Double check that the information you enter is correct.
                </Typography> }

            <Grid container spacing={2}>
                <RefundRequestForm readOnly={readOnly} requireTicketNumber />
            </Grid>

        </Box>
    );
}

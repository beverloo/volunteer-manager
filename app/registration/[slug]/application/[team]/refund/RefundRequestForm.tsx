// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { TextFieldElement } from '@proxy/react-hook-form-mui';

import Grid from '@mui/material/Grid';

/**
 * Props accepted by the <RefundRequestForm> component.
 */
interface RefundRequestFormProps {
    /**
     * Whether the form should be marked as read-only, useful in case their refund has been issued.
     */
    readOnly?: boolean;

    /**
     * Whether the ticket number is required. Refund administrators are able to omit it.
     */
    requireTicketNumber?: boolean;
}

/**
 * The <RefundRequestForm> component will display the actual form where volunteers can request a
 * ticket refund. This form is shared between the registration portal and the administration area.
 */
export function RefundRequestForm(props: RefundRequestFormProps) {
    const { readOnly } = props;

    return (
        <>
            <Grid size={{ xs: 12 }}>
                <TextFieldElement name="ticketNumber" label="What was your ticket number?"
                                  fullWidth size="small"
                                  slotProps={{ input: { readOnly } }}
                                  required={!!props.requireTicketNumber} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <TextFieldElement name="accountIban" label="Bank account IBAN" required
                                  fullWidth size="small" slotProps={{ input: { readOnly } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <TextFieldElement name="accountName" label="Bank account holder name" required
                                  fullWidth size="small" slotProps={{ input: { readOnly } }} />
            </Grid>
        </>
    );
}

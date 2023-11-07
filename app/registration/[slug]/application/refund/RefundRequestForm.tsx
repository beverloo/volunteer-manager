// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { TextFieldElement } from 'react-hook-form-mui';

import Grid from '@mui/material/Unstable_Grid2';

/**
 * Props accepted by the <RefundRequestForm> component.
 */
export interface RefundRequestFormProps {
    /**
     * Callback to be invoked when the value of one of the form fields has changed.
     */
    onChange?: () => void;

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
    const { onChange, readOnly } = props;

    return (
        <Grid container spacing={2}>
            <Grid xs={12}>
                <TextFieldElement name="ticketNumber" label="What was your ticket number?"
                                  fullWidth size="small" disabled={readOnly} onChange={onChange}
                                  required={!!props.requireTicketNumber} />
            </Grid>
            <Grid xs={12} md={6}>
                <TextFieldElement name="accountIban" label="Bank account IBAN" required
                                  fullWidth size="small" disabled={readOnly} onChange={onChange} />
            </Grid>
            <Grid xs={12} md={6}>
                <TextFieldElement name="accountName" label="Bank account name" required
                                  fullWidth size="small" disabled={readOnly} onChange={onChange} />
            </Grid>
        </Grid>
    );
}

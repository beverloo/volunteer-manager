// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { type FieldValues, FormContainer } from 'react-hook-form-mui';

import LockOpenIcon from '@mui/icons-material/LockOpen';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { RefundRequestForm } from '@app/registration/[slug]/application/refund/RefundRequestForm';
import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { callApi } from '@lib/callApi';

/**
 * Props accepted by the <ApplicationRefundRequest> component.
 */
export interface ApplicationRefundRequestProps {
    /**
     * Slug of the event for which the refund request is shown.
     */
    eventSlug: string;

    /**
     * Information about the volunteer's existing refund request, if one exists.
     */
    refund?: {
        ticketNumber?: string;
        accountIban: string;
        accountName: string;
    };

    /**
     * User ID of the volunteer for whom refund request preferences are being shown.
     */
    volunteerUserId: number;
}

/**
 * The <ApplicationRefundRequest> component displays information about this volunteer's ticket
 * refund request. This is very sensitive information only available to a select few leads.
 */
export function ApplicationRefundRequest(props: ApplicationRefundRequestProps) {
    const { refund } = props;

    const router = useRouter();

    const [ error, setError ] = useState<string | undefined>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleChange = useCallback(() => setInvalidated(true), [ /* no deps */ ]);
    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        setError(undefined);
        try {
            const response = await callApi('post', '/api/event/refund-request', {
                event: props.eventSlug,
                request: {
                    ticketNumber: data.ticketNumber,
                    accountIban: data.accountIban,
                    accountName: data.accountName,
                },
                adminOverrideUserId: props.volunteerUserId,
            });

            if (response.success) {
                router.refresh();
                setInvalidated(false);
            } else {
                setError(response.error);
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ props.eventSlug, props.volunteerUserId, router ]);

    const defaultValues = {
        ticketNumber: refund?.ticketNumber,
        accountIban: refund?.accountIban,
        accountName: refund?.accountName,
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Refund request
                <Tooltip title="Restricted to the refund permission">
                    <LockOpenIcon color="warning" fontSize="small"
                                  sx={{ verticalAlign: 'middle', mb: 0.25, ml: 1 }} />
                </Tooltip>
            </Typography>
            <FormContainer defaultValues={defaultValues} onSuccess={handleSubmit}>
                <RefundRequestForm onChange={handleChange} />
                <SubmitCollapse error={error} loading={loading} open={invalidated} sx={{ mt: 2 }} />
            </FormContainer>
        </Paper>
    );
}

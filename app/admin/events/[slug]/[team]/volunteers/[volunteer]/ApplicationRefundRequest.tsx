// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { type FieldValues, FormContainer, useForm } from 'react-hook-form-mui';
import Paper from '@mui/material/Paper';

import { PaperHeader } from '@app/admin/components/PaperHeader';
import { RefundRequestForm } from '@app/registration/[slug]/application/refund/RefundRequestForm';
import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { callApi } from '@lib/callApi';
import { Privilege } from '@lib/auth/Privileges';

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
    const form = useForm({
        defaultValues: {
            ticketNumber: refund?.ticketNumber,
            accountIban: refund?.accountIban,
            accountName: refund?.accountName,
        }
    });

    const [ error, setError ] = useState<string | undefined>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleClear = useCallback(async () => {
        //form.reset({
        //    ticketNumber: null!,
        //    accountIban: null!,
        //    accountName: null!,
        //});
        return { error: 'Not yet implemented...' };
    }, [ /* no deps */ ]);

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

    return (
        <Paper sx={{ p: 2 }}>
            <PaperHeader title="Refund request" privilege={Privilege.Refunds}
                         onClear={handleClear} subject="refund request" sx={{ mb: 2 }} />
            <FormContainer formContext={form} onSuccess={handleSubmit}>
                <RefundRequestForm onChange={handleChange} />
                <SubmitCollapse error={error} loading={loading} open={invalidated} sx={{ mt: 2 }} />
            </FormContainer>
        </Paper>
    );
}

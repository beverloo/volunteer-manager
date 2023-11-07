// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { type FieldValues, FormContainer } from 'react-hook-form-mui';

import Box from '@mui/material/Box';
import EuroIcon from '@mui/icons-material/Euro';
import LoadingButton from '@mui/lab/LoadingButton';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { RegistrationRefund } from '@lib/Registration';
import { Markdown } from '@components/Markdown';
import { RefundRequestForm } from './RefundRequestForm';
import { callApi } from '@lib/callApi';

/**
 * Message to display to volunteers when their preferences have been marked as read-only.
 */
const kPreferencesLockedMarkdown =
    '> Great news! Your request has been received, so your preferences have been locked in.';

/**
 * Props accepted by the <RefundRequest> component.
 */
export interface RefundRequestProps {
    /**
     * Slug of the event for which the refund request is being shown.
     */
    eventSlug: string;

    /**
     * Whether the form should be marked as read-only, useful in case their refund has been issued.
     */
    readOnly?: boolean;

    /**
     * Information about the volunteer's refund request that we're representing.
     */
    refund?: RegistrationRefund;
}

/**
 * The <RefundRequest> component will allow a volunteer to see and modify their ticket refund
 * request right from the portal. A form is used that's shared with the admin area.
 */
export function RefundRequest(props: RefundRequestProps) {
    const { readOnly, refund } = props;

    const router = useRouter();

    const [ error, setError ] = useState<string | undefined>();
    const [ loading, setLoading ] = useState<boolean>(false);
    const [ success, setSuccess ] = useState<string | undefined>();

    const handleSubmit = useCallback(async (data: FieldValues) => {
        setLoading(true);
        setError(undefined);
        setSuccess(undefined);
        try {
            if (readOnly)
                throw new Error('Your preferences have been locked in already.');

            const response = await callApi('post', '/api/event/refund-request', {
                event: props.eventSlug,
                request: {
                    ticketNumber: data.ticketNumber,
                    accountIban: data.accountIban,
                    accountName: data.accountName,
                },
            });

            if (response.success) {
                setSuccess('Your request has been received!');
                router.refresh();
            } else {
                setError(response.error ?? 'Oops! We were not able to store your refund request.');
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ props.eventSlug, readOnly, router ]);

    const defaultValues = {
        ticketNumber: refund?.ticketNumber,
        accountIban: refund?.accountIban,
        accountName: refund?.accountName,
    };

    return (
        <Box sx={{ mt: 1, mb: 2 }}>
            <Typography variant="h5" sx={ readOnly ? {} : { mb: 1 } }>
                Request a ticket refund
            </Typography>
            { readOnly && <Markdown sx={{ mt: -1, mb: 1 }}>{kPreferencesLockedMarkdown}</Markdown> }
            <FormContainer defaultValues={defaultValues} onSuccess={handleSubmit}>
                { !readOnly &&
                    <Typography sx={{ mb: 2 }}>
                        Your ticket number can be found in the confirmation e-mail you received when
                        you purchased it. Double check that the information you enter is correct.
                    </Typography> }

                <RefundRequestForm readOnly={readOnly} requireTicketNumber />
                { !readOnly &&
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ pt: 2 }}>
                        <LoadingButton startIcon={ <MonetizationOnIcon /> } variant="contained"
                                       loading={loading} type="submit">
                            Request a ticket refund
                        </LoadingButton>
                        { success &&
                            <Typography sx={{ color: 'success.main' }}>
                                {success}
                            </Typography> }
                        { error &&
                            <Typography sx={{ color: 'error.main' }}>
                                {error}
                            </Typography> }
                    </Stack> }
            </FormContainer>
        </Box>
    );
}

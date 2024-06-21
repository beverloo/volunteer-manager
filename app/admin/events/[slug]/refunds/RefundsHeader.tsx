// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { DateTimePickerElement } from 'react-hook-form-mui/date-pickers';
import { type FieldValues, FormContainer } from '@proxy/react-hook-form-mui';

import { default as MuiLink } from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';

import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { PaperHeader } from '@app/admin/components/PaperHeader';
import { PublishAlert } from '@app/admin/components/PublishAlert';
import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { Temporal } from '@lib/Temporal';
import { callApi } from '@lib/callApi';
import { dayjs } from '@lib/DateTime';

/**
 * Props accepted by the <RefundsHeader> component.
 */
export interface RefundsHeaderProps {
    /**
     * Whether the signed in volunteer has the ability to export this information.
     */
    enableExport?: boolean;

    /**
     * Information about the event for which refunds are being displayed.
     */
    event: PageInfo['event'];
}

/**
 * The <RefundsHeader> component displays the page the user is on together with some settings and a
 * general warning about the sensitivity of this information.
 */
export function RefundsHeader(props: RefundsHeaderProps) {
    const { event } = props;

    const router = useRouter();
    const handleExportButton = useCallback(() => {
        router.push('/admin/volunteers/exports');
    }, [ router ])

    const [ error, setError ] = useState<string | undefined>();
    const [ invalidated, setInvalidated ] = useState<boolean>(false);
    const [ loading, setLoading ] = useState<boolean>(false);

    const handleChange = useCallback(() => setInvalidated(true), [ /* no deps */ ]);
    const handleSettingsUpdate = useCallback(async (data: FieldValues) => {
        setLoading(true);
        try {
            const refundsStartTime =
                data.refundsStartTime ? dayjs(data.refundsStartTime).utc().toISOString()
                                      : undefined;
            const refundsEndTime =
                data.refundsEndTime ? dayjs(data.refundsEndTime).utc().toISOString()
                                    : undefined;

            const response = await callApi('post', '/api/admin/update-event', {
                event: event.slug,
                eventRefunds: {
                    refundsStartTime,
                    refundsEndTime,
                },
            });

            if (response.success) {
                setInvalidated(false);
            } else {
                setError('The refund settings could not be updated by the server.');
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ event.slug ]);

    const [ published, setPublished ] = useState<boolean>(event.publishRefunds);

    const handleRefundPublicationChange = useCallback(async () => {
        const response = await callApi('post', '/api/admin/update-publication', {
            event: event.slug,
            publishRefunds: !published,
        });

        if (response.success) {
            setPublished(published => !published);
        }
    }, [ event.slug, published ]);

    const href = `/registration/${event.slug}/application/refund`;

    const defaultValues = {
        ...event,
        refundsStartTime: undefined as any,
        refundsEndTime: undefined as any,
    };

    if (!!event.refundsStartTime) {
        const temporalValue =
            Temporal.ZonedDateTime.from(event.refundsStartTime).withTimeZone(event.timezone);

        defaultValues.refundsStartTime = dayjs(temporalValue.toString({ timeZoneName: 'never' }));
    }

    if (!!event.refundsEndTime) {
        const temporalValue =
            Temporal.ZonedDateTime.from(event.refundsEndTime).withTimeZone(event.timezone);

        defaultValues.refundsEndTime = dayjs(temporalValue.toString({ timeZoneName: 'never' }));

    }

    return (
        <>
            <Paper sx={{ p: 2 }}>
                <PaperHeader title="Refund requests" subtitle={event.shortName}
                             onExport={!!props.enableExport ? handleExportButton : undefined} />
                <Alert severity="info" sx={{ mt: 1 }}>
                    Volunteers can request their ticket to be refunded, which involves sharing
                    financial information. Access to these requests and settings is need to know.
                </Alert>
            </Paper>
            <Paper sx={{ p: 2 }}>
                <PublishAlert onClick={handleRefundPublicationChange} published={published}>
                    { !!published &&
                        <>
                            Availability of refunds is <strong>advertised</strong> to volunteers.
                        </> }
                    { !published &&
                        <>
                            Availability of refunds is <strong>not advertised</strong> to
                            volunteers, however,{' '}
                            <MuiLink component={Link} href={href}>the request form</MuiLink>{' '}
                            remains linkable.
                        </> }
                </PublishAlert>
                <FormContainer defaultValues={defaultValues} onSuccess={handleSettingsUpdate}>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid xs={6}>
                            <DateTimePickerElement name="refundsStartTime"
                                                   label="Accept refunds from"
                                                   inputProps={{ fullWidth: true, size: 'small' }}
                                                   onChange={handleChange} textReadOnly />
                        </Grid>
                        <Grid xs={6}>
                            <DateTimePickerElement name="refundsEndTime"
                                                   label="Accept refunds until"
                                                   inputProps={{ fullWidth: true, size: 'small' }}
                                                   onChange={handleChange} textReadOnly />
                        </Grid>
                    </Grid>
                    <SubmitCollapse error={error} loading={loading} open={invalidated}
                                    sx={{ mt: 2 }}/>
                </FormContainer>
            </Paper>
        </>
    );
}

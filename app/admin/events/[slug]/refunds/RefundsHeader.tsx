// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { type FieldValues, DateTimePickerElement, FormContainer } from 'react-hook-form-mui';

import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Unstable_Grid2';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import ShareIcon from '@mui/icons-material/Share';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import type { UpdatePublicationDefinition } from '@app/api/admin/updatePublication';
import { PublishAlert } from '@app/admin/components/PublishAlert';
import { SubmitCollapse } from '@app/admin/components/SubmitCollapse';
import { issueServerAction } from '@lib/issueServerAction';
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
            // TODO: Implement this function.
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [ /* no deps */ ]);

    const [ published, setPublished ] = useState<boolean>(event.publishRefunds);

    const handleRefundPublicationChange = useCallback(async () => {
        const response = await issueServerAction<UpdatePublicationDefinition>(
            '/api/admin/update-publication', {
                event: event.slug,
                publishRefunds: !published,
            });

        if (response.success) {
            setPublished(published => !published);
        }
    }, [ event.slug, published ]);

    const defaultValues = {
        ...event,
        refundsStartTime: event.refundsStartTime ? dayjs(event.refundsStartTime) : undefined,
        refundsEndTime: event.refundsStartTime ? dayjs(event.refundsStartTime) : undefined,
    }

    return (
        <Paper sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                <Typography variant="h5">
                    Refund requests
                    <Typography component="span" variant="h5" color="action.active" sx={{ pl: 1 }}>
                        ({event.shortName})
                    </Typography>
                </Typography>
                { !!props.enableExport &&
                    <Tooltip title="Export refund requests">
                        <IconButton onClick={handleExportButton}>
                            <ShareIcon fontSize="small" />
                        </IconButton>
                    </Tooltip> }
            </Stack>
            <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
                Volunteers can request their ticket to be refunded, for which they have to share
                <strong> financial information</strong> with us. Access to these requests and the
                associated settings is limited on a need to know basis.
            </Alert>
            <PublishAlert onClick={handleRefundPublicationChange} published={published}>
                { !!published && 'Availability of refunds is advertised to volunteers.' }
                { !published && 'Availability of refunds is hidden from volunteers.' }
            </PublishAlert>
            <FormContainer defaultValues={defaultValues} onSuccess={handleSettingsUpdate}>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid xs={6}>
                        <DateTimePickerElement name="refundsStartTime" label="Accept refunds from"
                                               inputProps={{ fullWidth: true, size: 'small' }}
                                               onChange={handleChange} textReadOnly />
                    </Grid>
                    <Grid xs={6}>
                        <DateTimePickerElement name="refundsEndTime" label="Accept refunds until"
                                               inputProps={{ fullWidth: true, size: 'small' }}
                                               onChange={handleChange} textReadOnly />
                    </Grid>
                </Grid>
                <SubmitCollapse error={error} loading={loading} open={invalidated} sx={{ mt: 2 }}/>
            </FormContainer>
        </Paper>
    );
}

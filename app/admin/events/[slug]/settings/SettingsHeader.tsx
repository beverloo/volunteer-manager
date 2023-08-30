// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import LinkIcon from '@mui/icons-material/Link';
import Paper from '@mui/material/Paper';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import Stack from '@mui/material/Stack';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import Typography from '@mui/material/Typography';

import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import type { UpdateEventDefinition } from '@app/api/admin/updateEvent';
import { ContrastBox } from '@app/admin/components/ContrastBox';
import { SettingDialog } from '@app/admin/components/SettingDialog';
import { TransitionAlert } from '@app/admin/components/TransitionAlert';
import { issueServerAction } from '@lib/issueServerAction';

/**
 * Description to use for the event publication dialog.
 */
const kPublishDescription =
    'Publishing this event will publicly reference it, and grants administration rights to ' +
    'senior volunteers who participate in it.';

/**
 * Description to use for the event suspension dialog.
 */
const kSuspendDescription =
    'Suspending this event will remove all public references, and revoke the rights granted to ' +
    'senior volunteers who participate in it.';

/**
 * Props accepted by the <SettingsHeader> component.
 */
export interface SettingsHeaderProps {
    /**
     * Information about the event whose settings are being changed.
     */
    event: PageInfo['event'];
}

/**
 * The <SettingsHeader> component displays the header for the settings page, as well as some of the
 * more powerful options that we display separately from regular page content.
 */
export function SettingsHeader(props: SettingsHeaderProps) {
    const { event } = props;

    const router = useRouter();

    const [ publishOpen, setPublishOpen ] = useState<boolean>(false);
    const [ suspendOpen, setSuspendOpen ] = useState<boolean>(false);

    const handleClose = useCallback((invalidated: boolean) => {
        if (invalidated)
            router.refresh();

        setPublishOpen(false);
        setSuspendOpen(false);
    }, [ router ]);

    const openPublish = useCallback(() => setPublishOpen(true), [ /* no deps */ ]);
    const handlePublish = useCallback(async () => {
        const response = await issueServerAction<UpdateEventDefinition>('/api/admin/update-event', {
            event: event.slug,
            eventHidden: /* publish= */ false,
        });

        return response.success ? { success: `${event.shortName} has been published.` }
                                : { error: `${event.shortName} could not be published.` };
    }, [ event ]);

    const openSuspend = useCallback(() => setSuspendOpen(true), [ /* no deps */ ]);
    const handleSuspend = useCallback(async () => {
        const response = await issueServerAction<UpdateEventDefinition>('/api/admin/update-event', {
            event: event.slug,
            eventHidden: /* suspend= */ true,
        });

        return response.success ? { success: `${event.shortName} has been suspended.` }
                                : { error: `${event.shortName} could not be suspended.` };
    }, [ event ]);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5">
                Settings
                <Typography component="span" variant="h5" color="action.active" sx={{ pl: 1 }}>
                    ({event.shortName})
                </Typography>
            </Typography>
            <ContrastBox sx={{ mt: 1, px: 2, py: 1 }}>
                <Stack divider={ <Divider orientation="vertical" flexItem /> }
                       direction="row" spacing={1}>

                    { event.hidden &&
                        <Button startIcon={ <PlayCircleIcon /> } onClick={openPublish}>
                            Publish
                        </Button> }

                    { !event.hidden &&
                        <Button startIcon={ <StopCircleIcon /> } onClick={openSuspend}>
                            Suspend
                        </Button> }

                    <Button startIcon={ <LinkIcon /> }>Change slug</Button>

                </Stack>
            </ContrastBox>
            <TransitionAlert severity={ event.hidden ? 'error' : 'success' } sx={{ mt: 2 }}>
                { event.hidden &&
                    <>
                        <strong>{event.shortName}</strong> is currently suspended. Senior rights
                        granted for this event have been revoked, public references have been
                        removed.
                    </> }
                { !event.hidden &&
                    <>
                        <strong>{event.shortName}</strong> is currently live. Senior rights granted
                        for this event are active, and public references to the event remain
                        available.
                    </> }
            </TransitionAlert>
            <SettingDialog title={`Publish ${event.shortName}`} open={publishOpen}
                           description={kPublishDescription} submitLabel="Publish"
                           onClose={handleClose} onSubmit={handlePublish} />

            <SettingDialog title={`Suspend ${event.shortName}`} open={suspendOpen}
                           description={kSuspendDescription} submitLabel="Suspend"
                           onClose={handleClose} onSubmit={handleSuspend} />
        </Paper>
    );
}

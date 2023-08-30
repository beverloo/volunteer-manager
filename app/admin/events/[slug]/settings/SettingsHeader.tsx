// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import LinkIcon from '@mui/icons-material/Link';
import Paper from '@mui/material/Paper';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import Stack from '@mui/material/Stack';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import Typography from '@mui/material/Typography';

import type { PageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';
import { ContrastBox } from '@app/admin/components/ContrastBox';
import { Privilege, can } from '@lib/auth/Privileges';

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
 * The <SettingsHeader> component
 */
export function SettingsHeader(props: SettingsHeaderProps) {
    const { event } = props;

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
                        <Button startIcon={ <PlayCircleIcon /> }>Publish</Button> }

                    { !event.hidden &&
                        <Button startIcon={ <StopCircleIcon /> }>Suspend</Button> }

                    <Button startIcon={ <LinkIcon /> }>Change slug</Button>

                </Stack>
            </ContrastBox>
        </Paper>
    );
}

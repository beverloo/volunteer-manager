// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useState } from 'react';

import Divider from '@mui/material/Divider';
import GoogleIcon from '@mui/icons-material/Google';
import HeatPumpIcon from '@mui/icons-material/HeatPump';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { ContrastBox } from '../components/ContrastBox';

/**
 * Different states that a service can be in.
 */
type ServiceState = 'unknown' | 'error' | 'success';

/**
 * Props accepted by the <ServiceStatus> component.
 */
interface ServiceStatusProps {
    /**
     * Icon as the service should be represented.
     */
    icon: React.ReactNode;

    /**
     * The label of the service to display.
     */
    label: string;

    /**
     * Status of the service, as confirmed by the lifetime check.
     */
    status: ServiceState;
}

/**
 * The <ServiceStatus> component represents the status of an individual service whose state should
 * be displayed on this page. The `props` indicate the state of the service.
 */
function ServiceStatus(props: ServiceStatusProps) {
    return (
        <Stack direction="column" spacing={1} sx={{ width: '100px', color: 'text.disabled' }}
               justifyContent="center" alignItems="center">
            {props.icon}
            <Typography>
                {props.label}
            </Typography>
        </Stack>
    );
}

/**
 * The <StatusHeader> component displays the header of the Integrations page, and also includes the
 * ability to do a "ping" check to each of the external integrations to test if they're functional.
 */
export function StatusHeader() {
    const [ googleStatus, setGoogleStatus ] = useState<ServiceState>('unknown');
    const [ vertexAiStatus, setVertexAiStatus ] = useState<ServiceState>('unknown');

    // TODO: Actually run service status pings.
    // TODO: Add a mechanism to see input/output of the pings.

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 1 }}>
                Integrations
            </Typography>
            <Stack direction="row" spacing={2}>
                <ContrastBox sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                    <Tooltip title="Verify integrations">
                        <IconButton>
                            <PublishedWithChangesIcon />
                        </IconButton>
                    </Tooltip>
                </ContrastBox>
                <ContrastBox sx={{ p: 2, flexGrow: 1 }}>
                    <Stack direction="row" spacing={2}
                           divider={ <Divider orientation="vertical" flexItem /> }>

                        <ServiceStatus icon={ <GoogleIcon /> }
                                       label="Google" status={googleStatus} />

                        <ServiceStatus icon={ <HeatPumpIcon /> }
                                       label="Vertex AI" status={vertexAiStatus} />

                    </Stack>
                </ContrastBox>
            </Stack>
        </Paper>
    );
}

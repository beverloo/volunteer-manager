// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Image from 'next/image';

import Card from '@mui/material/Card';
import Collapse from '@mui/material/Collapse';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * The <AdviceContainer> component fetches the most recent advice from the server. This may take a
 * little while given that it's generated in real time, so a loading interface is included as well.
 */
export function AdviceContainer() {
    // TODO: Actually fetch the advice from the server. Make sure it's aggressively cached.

    return (
        <Card sx={{ p: 2 }}>
            <Collapse in={true}>
                <Stack alignItems="center" spacing={2} sx={{ py: 2 }}>
                    <Image src="/images/advice.png" alt="Del a Rie Advies Logo"
                           height={128} width={175} />
                    <Typography sx={{ textAlign: 'center', textWrap: 'balance' }}>
                        We've received your request for personal advice, and one of our advisors is
                        already crafting a personalised plan just for you! Sit tight — we'll be
                        sending it your way shortly!
                    </Typography>
                    <LinearProgress color="primary" sx={{ alignSelf: 'stretch' }} />
                </Stack>
            </Collapse>
        </Card>
    );
}

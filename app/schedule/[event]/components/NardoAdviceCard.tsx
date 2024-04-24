// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Image from 'next/image';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * Props accepted by the <NardoAdviceCard> component.
 */
export interface NardoAdviceCardProps {
    /**
     * The piece of advice that should be displayed.
     */
    advice: string;
}

/**
 * The <NardoAdviceCard> displays a card with the latest piece of Del a Rie advice issued by the
 * server. It includes a colourful graphic to remind us of what's important in live.
 */
export function NardoAdviceCard(props: NardoAdviceCardProps) {
    return (
        <Stack component={Card} direction="row" justifyContent="space-between" alignItems="center"
               spacing={4} sx={{ p: 2, backgroundColor: '#F9FBE7' }}>
            <Box sx={{ alignSelf: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {props.advice}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.disabled', pt: 0.5 }}>
                    {' '}— Del a Rie Advies
                </Typography>
            </Box>
            <Image src="/images/advice.png" width={89} height={65} alt="Yo" />
        </Stack>
    );
}

// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

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
        <Stack component={Card} direction="row" alignItems="stretch" spacing={2}>
            <Box sx={{
                backgroundImage: 'url(/images/del-a-rie-advies.jpg)',
                backgroundPosition: 'center 25%',
                minHeight: '125px',
                aspectRatio: { xs: 1.5, md: 2, lg: 3 } }} />
            <Box sx={{ p: 2, pr: 4, alignSelf: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', textWrap: 'balance' }}>
                    {props.advice}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    {' '}— Del a Rie Advies
                </Typography>
            </Box>
        </Stack>
    );
}

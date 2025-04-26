// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

/**
 * Props accepted by the <NardoAdviceCard> component.
 */
interface NardoAdviceCardProps {
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
        <Card>
            <Box sx={{
                backgroundImage: 'url(/images/del-a-rie-advies-2.jpg?2025)',
                backgroundPosition: 'center 70%',
                backgroundSize: 'cover',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                aspectRatio: 4 }}>
                <Typography variant="button" sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 1,
                    color: 'black',
                    alignSelf: 'flex-end',
                    m: 1,
                    px: 1,
                }}>
                    Ad
                </Typography>
            </Box>
            <CardContent sx={{ pb: '16px !important' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {props.advice}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.disabled', pt: 0.5 }}>
                    {' '}— Del a Rie Advies
                </Typography>
            </CardContent>
        </Card>
    );
}

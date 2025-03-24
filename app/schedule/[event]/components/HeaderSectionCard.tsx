// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Card from '@mui/material/Card';

/**
 * The <HeaderSectionCard> component represents a header card, which is displayed in line with other
 * sections on desktop devices, but as a full-width square card on mobile.
 */
export function HeaderSectionCard(props: React.PropsWithChildren) {
    return (
        <Card sx={{
            '&.MuiCard-root': {
                borderRadius: { xs: 0, md: 1 },
                margin: { xs: '-16px -16px 0 -16px', md: 0 },
            },
        }}>
            {props.children}
        </Card>
    );
}

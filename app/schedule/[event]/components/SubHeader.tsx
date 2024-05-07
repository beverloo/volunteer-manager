// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Typography from '@mui/material/Typography';

/**
 * Component that displays a Material-like section header drawn outside the actual card.
 */
export function SubHeader(props: React.PropsWithChildren) {
    return (
        <Typography variant="button" sx={{ color: 'text.secondary' }}>
            {props.children}
        </Typography>
    );
}

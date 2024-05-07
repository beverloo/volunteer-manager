// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Typography from '@mui/material/Typography';

/**
 * The <ListItemDetails> component can be used to draw non-wrapping details at the end of a regular
 * list item. The text will be smaller than the regular list item content.
 */
export function ListItemDetails(props: React.PropsWithChildren) {
    return (
        <Typography variant="caption"
                    sx={{ color: 'text.secondary', whiteSpace: 'nowrap', pl: 2 }}>
            {props.children}
        </Typography>
    );
}

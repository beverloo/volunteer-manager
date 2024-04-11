// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Box from '@mui/material/Box';

/**
 * The <DisplayContainer> component is intended to contain the display's contents. The component is
 * scrollable, although without a visual scrollbar.
 */
export function DisplayContainer(props: React.PropsWithChildren) {
    return (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {props.children}
        </Box>
    );
}

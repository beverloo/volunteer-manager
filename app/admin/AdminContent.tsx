// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Stack from '@mui/material/Stack';

/**
 * Containing component for content in the administration area. Arranges the children so that they
 * stack horizontally.
 */
export function AdminContent(props: React.PropsWithChildren) {
    return (
        <Stack direction="row" spacing={2} sx={{ pt: 2, pb: 1 }}>
            {props.children}
        </Stack>
    );
}

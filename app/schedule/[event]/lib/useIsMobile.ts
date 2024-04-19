// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import useMediaQuery from '@mui/material/useMediaQuery';

/**
 * Returns whether the page is being shown on a mobile device.
 */
export function useIsMobile(): boolean {
    return useMediaQuery((theme: any) => theme.breakpoints.down('md'));
}

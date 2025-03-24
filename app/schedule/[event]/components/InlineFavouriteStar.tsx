// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import StarIcon from '@mui/icons-material/Star';

/**
 * The <InlineFavouriteStar> component displays a favourite star inline with a text element, and is
 * intended to be used as part of an event list on the volunteer portal.
 */
export function InlineFavouriteStar() {
    return (
        <StarIcon color="primary" fontSize="inherit"
                  sx={{
                      verticalAlign: 'middle',
                      mr: .5,
                      mt: -0.25
                  }} />
    );
}

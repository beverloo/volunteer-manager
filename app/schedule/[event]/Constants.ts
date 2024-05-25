// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';

/**
 * Maximum width, in pixels, the portal should use on desktop platforms. We use the `md` breakpoint
 * from MUI as the CSS media query, which equates 900px for the full viewport width.
 */
export const kDesktopMaximumWidthPx = 1280;

/**
 * Width, in pixels, the main menu should occupy on desktop platforms. This is a fixed size, and
 * will be applied no matter the width that will be taken by the content.
 */
export const kDesktopMenuWidthPx = 275;

/**
 * Style that can be used to enforce, at most, a single line to be drawn as part of a typography
 * component.
 */
export const kEnforceSingleLine: SxProps<Theme> = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

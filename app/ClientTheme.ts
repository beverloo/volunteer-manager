// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

'use client';

import { Roboto } from 'next/font/google';
import { createTheme } from '@mui/material/styles';

/**
 * The Roboto font, loaded through NextJS' font stack, with default settings for Material UI.
 */
export const kFontRoboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'block',
  fallback: ['Helvetica', 'Arial', 'sans-serif'],
});

/**
 * The Material UI theme configuration that will apply to the Volunteer Manager environment.
 */
export const kTheme = createTheme({
  typography: {
    fontFamily: kFontRoboto.style.fontFamily,
  },
});

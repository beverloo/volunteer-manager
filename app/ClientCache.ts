// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { default as createEmotionCache } from '@emotion/cache';

/**
 * Whether the current request is being handled in a browser (true) or on the server (false).
 */
export const kInBrowser = typeof document !== 'undefined';

/**
 * Creates a cache for the Emotion style management library. Will be created at the top of the
 * page's <head> to ensure that it's applied before Material UI's own style rules.
 *
 * Source:
 * https://github.com/mui/material-ui/blob/093c4d29cab975ad90bec3af5b15f919cea255a6/examples/material-next-ts/src/createEmotionCache.ts
 */
export function createCache() {
    let insertionPoint = undefined;
    if (kInBrowser) {
        insertionPoint = document.querySelector<HTMLMetaElement>(
            'meta[name="emotion-insertion-point"]') ?? undefined;
    }

    return createEmotionCache({ key: 'mui-style', insertionPoint });
}

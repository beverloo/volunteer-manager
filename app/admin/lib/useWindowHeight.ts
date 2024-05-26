// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { useEffect, useState } from 'react';

/**
 * Returns the inner height of the current window, or "0" when the page is being server-side
 * rendered, where there obviously is no screen.
 */
function safeWindowInnerHeight(): number {
    return typeof window === 'undefined' ? /* ssr= */ 0
                                         : window.innerHeight;
}

/**
 * Hook representing the window's height, that updates when it changes.
 */
export function useWindowHeight() {
    const [ height, setHeight ] = useState<number>(() => safeWindowInnerHeight());
    useEffect(() => {
        if (typeof window === 'undefined')
            return;

        function listener() {
            setHeight(safeWindowInnerHeight());
        }

        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);

    }, [ /* no deps */ ]);

    return height;
}

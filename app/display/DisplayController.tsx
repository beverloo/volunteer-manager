// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useEffect, useState } from 'react';

import { DisplayContext, type DisplayContextInfo } from './DisplayContext';
import { DisplayTheme } from './DisplayTheme';
import { callApi } from '@lib/callApi';
import { onceInitialiseGlobals, markUpdateCompleted, isLockedValue, setLockedValue } from './Globals';
import device from './lib/Device';

/**
 * Define the `globalThis.animeCon` property. This is injected in the WebView used to display the
 * Volunteer Manager on the AnimeCon Display devices, as a message port.
 */
declare module globalThis {
    let animeConRefreshListeners: ((result: boolean) => void)[];
    let animeConRefresh: undefined | (() => void);
}

/**
 * How frequently should the display check in with the server? Can be configured by the server.
 */
const kDefaultUpdateFrequencyMs = /* 5 minutes= */ 5 * 60 * 1000;

/**
 * Helper function to manually refresh the context with the server. Should be sparsely used.
 */
export async function refreshContext(): Promise<boolean> {
    if (!Array.isArray(globalThis.animeConRefreshListeners))
        globalThis.animeConRefreshListeners = [];

    if (!globalThis.animeConRefresh)
        return false;  // the <DisplayController> component is not mounted

    return new Promise(resolve => {
        globalThis.animeConRefreshListeners.push(resolve);
        globalThis.animeConRefresh?.();
    });
}

/**
 * The <DisplayController> component controls the display; it manages the display's state with the
 * Volunteer Manager server and makes sure that it continues to be periodically updated.
 */
export function DisplayController(props: React.PropsWithChildren) {
    const [ context, setContext ] = useState<DisplayContextInfo | undefined>();

    const [ invalidationCounter, setInvalidationCounter ] = useState<number>(0);
    const [ updateFrequencyMs, setUpdateFrequencyMs ] =
        useState<number>(kDefaultUpdateFrequencyMs);

    onceInitialiseGlobals();

    // TODO: Somehow reflect the result of the `animeConRefresh` helper.

    // Effect that assigns a listener function to the `animeConRefresh` global, which powers the
    // refresh operations elsewhere in the user interface. The helper will be unassigned when this
    // component is unmounted as no further refreshes can be requested anymore.
    useEffect(() => {
        globalThis.animeConRefreshListeners = [];
        globalThis.animeConRefresh = () =>
            setInvalidationCounter(invalidationCounter => invalidationCounter + 1);

        return () => globalThis.animeConRefresh = undefined;

    }, [ /* no dependencies */ ]);

    // Effect that updates the display at a configured cadence. This has a default value, however,
    // can be overridden by the server every time that a context update is requested.
    useEffect(() => {
        const timer = setInterval(() => {
            setInvalidationCounter(invalidationCounter => invalidationCounter + 1);
        }, updateFrequencyMs);

        return () => clearInterval(timer);

    }, [ updateFrequencyMs ]);

    // Effect that actually updates the context. This is done by making a network call to the
    // Display API, which identifies the displays based on an identifier assigned by the server,
    // that is then stored in a cookie on the client. Invalidated through various signals.
    useEffect(() => {
        callApi('get', '/api/display', { /* no input is required */ }).then(context => {
            setContext(context);
            setUpdateFrequencyMs(context.updateFrequencyMs);

            // Automatically lock (or unlock) the device based on the received `context`. No
            // feedback is given, other than the "lock" icon shown in the overflow menu.
            if (context.locked !== isLockedValue()) {
                context.locked ? device.enableKiosk()
                               : device.disableKiosk();

                setLockedValue(context.locked);
            }

            // Mark the update as having completed, hiding a warning in the menu.
            markUpdateCompleted();

            // Announce that the update has been completed to any listeners.
            for (const listener of globalThis.animeConRefreshListeners)
                listener(/* result= */ true);

        }).catch(error => {
            // Announce that the update could not be completed to any listeners.
            for (const listener of globalThis.animeConRefreshListeners)
                listener(/* result= */ false);

        }).finally(() => {
            globalThis.animeConRefreshListeners = [ /* empty list */ ];
        });
    }, [ invalidationCounter ]);

    return (
        <DisplayTheme>
            <DisplayContext.Provider value={context}>
                {props.children}
            </DisplayContext.Provider>
        </DisplayTheme>
    );
}

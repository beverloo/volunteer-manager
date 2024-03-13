// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { createContext } from 'react';

import type { DisplayDefinition } from '@app/api/display/route';

/**
 * Context conveyed for the entire display. The context is owned and maintained by the
 * <DisplayController> component, which also provides the necessary updates.
 */
export type DisplayContextInfo = DisplayDefinition['response'];

/**
 * The <DisplayContext> carries information about the display's configuration.
 */
export const DisplayContext = createContext<DisplayContextInfo | undefined>(
    /* unprovisioned= */ undefined);

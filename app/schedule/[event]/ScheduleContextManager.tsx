// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { ScheduleContext } from './ScheduleContext';

/**
 * Props accepted by the <ScheduleContextManager> component.
 */
export interface ScheduleContextManagerProps {
    // TODO
}

/**
 * The <ScheduleContextManager> component powers the context used by the entire schedule app. It
 * periodically updates it, and makes sure that state is refreshed when connectivity state changes.
 */
export function ScheduleContextManager(props: React.PropsWithChildren<ScheduleContextManagerProps>)
{
    return (
        <ScheduleContext.Provider value={undefined}>
            {props.children}
        </ScheduleContext.Provider>
    );
}

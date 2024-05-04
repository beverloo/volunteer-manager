// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

/**
 * Props accepted by the <CloseForm> component.
 */
export interface CloseFormProps {
    /**
     * Unique slug of the event for which the request is in scope.
     */
    event: string;

    /**
     * Unique ID of the request that can be acknowledged.
     */
    requestId: number;
}

/**
 * The <CloseForm> component provides the ability to close out a help request. The reason must be
 * given, to make sure that the reason for the help request is properly recorded.
 */
export function CloseForm(props: CloseFormProps) {
    return (
        <>
            TODO
        </>
    );
}

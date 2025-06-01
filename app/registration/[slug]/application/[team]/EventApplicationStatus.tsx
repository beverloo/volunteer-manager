// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Environment } from '@lib/Environment';
import type { EnvironmentContext, EnvironmentContextEventAccess } from '@lib/EnvironmentContext';

/**
 * Props accepted by the <EventApplicationStatus> component.
 */
interface EventApplicationStatusProps {
    /**
     * Context for which the page is being rendered.
     */
    context: EnvironmentContext;

    /**
     * Environment for which the page is being rendered.
     */
    environment: Environment;

    /**
     * Event for which the page is being rendered.
     */
    event: EnvironmentContextEventAccess;

    /**
     * URL-safe slug of the team for which the status should be displayed.
     */
    team: string;
}

/**
 * The <EventApplicationStatus> component displays the status of a volunteer's application. This is
 * a server-side component that fetches the relevant information autonomously.
 */
export default async function EventApplicationStatus(props: EventApplicationStatusProps) {
    const { context, environment, event, team } = props;

    return (
        <>
            TODO
        </>
    );
}

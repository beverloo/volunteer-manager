// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type ServiceDriver } from './ServiceDriver';

/**
 * Defines the interface that each configured service has to implement.
 */
export interface Service<DriverType = ServiceDriver> {
    /**
     * Unique ID of the service that this instance represents.
     */
    id: number;

    /**
     * Human-readable, descriptive name of the service.
     */
    name: string;

    /**
     * Unique ID of the event that this service is operating for
     */
    eventId: number;

    /**
     * Boolean that indicates whether the service should be considered for automatic execution.
     */
    enabled: boolean;

    /**
     * Interval, in seconds, between invocations of this service.
     */
    interval: number;

    /**
     * The driver that is responsible for executing the service.
     */
    driver: DriverType;

    /**
     * Parameters that should be made available to the service.
     */
    params: any;

    /**
     * Seconds since the last execution of this service.
     */
    secondsSinceLastExecution: number;
}

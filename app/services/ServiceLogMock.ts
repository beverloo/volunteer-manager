// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { ServiceLogException, ServiceLogMessage, ServiceState } from './ServiceLog';
import { ServiceLog } from './ServiceLog';

/**
 * Contains information about a singular service execution by the ServiceLogMock class. Can be
 * obtained by calling `ServiceLogMock::TakeLogs()`.
 */
export interface ServiceLogExecutionInfo {
    /**
     * Unique ID of the service that was responsible for this execution.
     */
    serviceId: number;

    /**
     * State of the service at the time that it finished execution.
     */
    state: ServiceState;

    /**
     * Exceptions (zero or more) that occurred while executing the service.
     */
    exceptions: ServiceLogException[];

    /**
     * Errors (zero or more) that occurred while executing the service.
     */
    errors: ServiceLogMessage[];

    /**
     * Warnings (zero or more) that occurred while executing the service.
     */
    warnings: ServiceLogMessage[];
}

/**
 * Global storage for execution information issued by the service log.
 */
let globalServiceLogExecutionInfos: ServiceLogExecutionInfo[] = [];

/**
 * Implementation of the ServiceLog interface that records all information as opposed to writing
 * it to the database. Only intended for usage in tests. Results will be stored in the global scope
 * and can be obtained through the `ServiceLogMock::TakeLogs()` method, and must be cleared by
 * calling `ServiceLogMock::Reset()` after the execution of each test.
 */
export class ServiceLogMock extends ServiceLog {
    /**
     * Resets the global state of the ServiceLogMock. Must be called at the end of every test.
     */
    static Reset(): void {
        globalServiceLogExecutionInfos = [];
    }

    /**
     * Retrieves the service logs that were created since the last time either Reset() or this
     * method was called. Logs are cleared automatically after they were taken out.
     */
    static TakeLogs(): ServiceLogExecutionInfo[] {
        const serviceLogExecutionInfos = globalServiceLogExecutionInfos;
        globalServiceLogExecutionInfos = [];

        return serviceLogExecutionInfos;
    }

    async finishExecution(): Promise<void> {
        globalServiceLogExecutionInfos.push({
            serviceId: this.serviceId,
            state: this.state,
            exceptions: this.exceptions,
            errors: this.errors,
            warnings: this.warnings,
        });
    }
}

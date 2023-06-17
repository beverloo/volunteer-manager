// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * State of the service. Thi smaps to the states that can be stored in the database.
 */
export type ServiceState = 'success' | 'warning' | 'error' | 'exception';

/**
 * Interface for the logging interface to which service execution will write information. The
 * written information will be committed to the database once execution has completed.
 */
export interface ServiceLog {
    /**
     * Returns the current state of the service according to the logged information.
     */
    state: ServiceState;

    /**
     * Returns whether execution of the service has completed without errors or exceptions.
     */
    success: boolean;

    /**
     * To be called when execution is about to begin.
     */
    beginExecution();

    /**
     * To be called when an exception has occurred during execution. Calling this method, which
     * should only be done by the ServiceManager, will affect the success status of the execution.
     * Services must not continue executing after an exception has been thrown.
     */
    exception(error: Error): void;

    /**
     * To be called when an error has occurred during execution. Calling this method will affect the
     * success status of the service's execution.
     */
    error(...data: any): void;

    /**
     * To be called when a warning has occurred during execution. Calling this method will flag the
     * execution as having seen a warning.
     */
    warning(...data: any): void;

    /**
     * To be called when execution of the service has finished. This will write the logs to the
     * database, which the caller has the option of waiting for.
     */
    finishExecution(): Promise<void>;
}

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * State of the service. Thi smaps to the states that can be stored in the database.
 */
export type ServiceState = 'success' | 'warning' | 'error' | 'exception';

/**
 * Information stored for each exception thrown during the execution of a service.
 */
export interface ServiceLogException {
    /**
     * The error that was thrown during this exception.
     */
    error: Error;
}

/**
 * Information store for each error or warning issued during the execution of a service.
 */
export interface ServiceLogMessage {
    /**
     * Data passed as information during the message.
     */
    data: any[];
}

/**
 * Interface for the logging interface to which service execution will write information. The
 * written information will be committed to the database once execution has completed.
 */
export abstract class ServiceLog {
    #exceptions: ServiceLogException[];
    #errors: ServiceLogMessage[];
    #warnings: ServiceLogMessage[];

    #state: ServiceState | undefined;

    constructor() {
        this.#exceptions = [];
        this.#errors = [];
        this.#warnings = [];

        this.#state = undefined;
    }

    /**
     * Returns the current state of the service according to the logged information.
     */
    get state(): ServiceState { return this.#state; }
    protected set state(value: ServiceState) { this.#state = value; }

    /**
     * Returns whether execution of the service has completed without errors or exceptions.
     */
    get success(): boolean { return ['success', 'warning'].includes(this.#state); }

    /**
     * Returns the exceptions that were thrown during execution of this service. Only available to
     * implementations of the ServiceLog abstract class.
     */
    protected get exceptions() { return this.#exceptions; }

    /**
     * Returns the errors that were issued during execution of this service. Only available to
     * implementations of the ServiceLog abstract class.
     */
    protected get errors() { return this.#errors; }

    /**
     * Returns the warnings that were issued during execution of this service. Only available to
     * implementations of the ServiceLog abstract class.
     */
    protected get warnings() { return this.#warnings; }

    /**
     * To be called when execution is about to begin.
     */
    abstract beginExecution();

    /**
     * To be called when an exception has occurred during execution. Calling this method, which
     * should only be done by the ServiceManager, will affect the success status of the execution.
     * Services must not continue executing after an exception has been thrown.
     */
    exception(error: Error): void {
        switch (this.#state) {
            case undefined:
                throw new Error('The service has not begun execution yet, cannot yield results');

            case 'exception':
                throw new Error('Illegal state: the service has already thrown an exception');

            case 'success':
            case 'warning':
            case 'error':
                this.#state = 'exception';  // escalate
                break;
        }

        this.#exceptions.push({ error });
    }

    /**
     * To be called when an error has occurred during execution. Calling this method will affect the
     * success status of the service's execution.
     */
    error(...data: any): void {
        switch (this.#state) {
            case undefined:
                throw new Error('The service has not begun execution yet, cannot yield results');

            case 'exception':
                throw new Error('Illegal state: the service has already thrown an exception');

            case 'success':
            case 'warning':
                this.#state = 'error';  // escalate
                break;

            case 'error':
                break;
        }

        this.#errors.push({ data });
    }

    /**
     * To be called when a warning has occurred during execution. Calling this method will flag the
     * execution as having seen a warning.
     */
    warning(...data: any): void {
        switch (this.#state) {
            case undefined:
                throw new Error('The service has not begun execution yet, cannot yield results');

            case 'exception':
                throw new Error('Illegal state: the service has already thrown an exception');

            case 'success':
                this.#state = 'warning';  // escalate
                break;

            case 'error':
            case 'warning':
                break;
        }

        this.#warnings.push({ data });
    }

    /**
     * To be called when execution of the service has finished. This will write the logs to the
     * database, which the caller has the option of waiting for.
     */
    abstract finishExecution(): Promise<void>;
}

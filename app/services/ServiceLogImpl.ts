// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type ServiceLog, type ServiceState } from './ServiceLog';
import { sql } from '../lib/database';

/**
 * Production implementation of the ServiceLog interface.
 */
export class ServiceLogImpl implements ServiceLog {
    #serviceId: number;

    #finalized: boolean;
    #messages: { type: string, message: string }[];
    #state: ServiceState | undefined;
    #startTime: bigint;

    constructor(serviceId: number) {
        this.#serviceId = serviceId;

        this.#finalized = false;
        this.#state = undefined;  // pending
        this.#messages = [];
    }

    // ---------------------------------------------------------------------------------------------
    // ServiceLog implementation:
    // ---------------------------------------------------------------------------------------------

    get state() { return this.#state; }
    get success() { return ['success', 'warning'].includes(this.#state); }

    beginExecution() {
        if (!!this.#state)
            throw new Error('The service has already begun execution, unable to restart');

        this.#state = 'success';
        this.#startTime = process.hrtime.bigint();
    }

    exception(error: Error): void {
        switch (this.#state) {
            case undefined:
                throw new Error('The service has not begun execution yet, cannot yield results');

            case 'exception':
                throw new Error('Illegal state: the service has already thrown an exception');

            case 'success':
            case 'warning':
            case 'error':
                this.#state = 'exception';
                break;
        }

        this.#messages.push({
            type: 'exception',
            message: JSON.stringify({
                name: error.name,
                message: error.message,
                stack: error.stack,
            }),
        });
    }

    error(...data: any): void {
        switch (this.#state) {
            case undefined:
                throw new Error('The service has not begun execution yet, cannot yield results');

            case 'exception':
                throw new Error('Illegal state: the service has already thrown an exception');

            case 'success':
            case 'warning':
                this.#state = 'error';
                break;

            case 'error':
                break;
        }

        this.#messages.push({
            type: 'error',
            message: data.map(String).join(', '),
        });
    }

    warning(...data: any): void {
        switch (this.#state) {
            case undefined:
                throw new Error('The service has not begun execution yet, cannot yield results');

            case 'exception':
                throw new Error('Illegal state: the service has already thrown an exception');

            case 'success':
                this.#state = 'warning';
                break;

            case 'error':
            case 'warning':
                break;
        }

        this.#messages.push({
            type: 'warning',
            message: data.map(String).join(', '),
        });
    }

    async finishExecution(): Promise<void> {
        if (this.#finalized)
            throw new Error('The service execution has already been finalized');

        this.#finalized = true;

        const runtimeNanoseconds = process.hrtime.bigint() - this.#startTime;
        const runtimeMilliseconds = Number(runtimeNanoseconds) / 1000 / 1000;

        const messages = JSON.stringify(this.#messages);

        await sql`
            INSERT INTO
                services_logs
                (service_id, service_log_result, service_log_runtime, service_log_data)
            VALUES
                (${this.#serviceId}, ${this.#state}, ${runtimeMilliseconds}, ${messages})`;
    }
}

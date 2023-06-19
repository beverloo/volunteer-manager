// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { ServiceLog } from './ServiceLog';
import { sql } from '../lib/database';

/**
 * Production implementation of the ServiceLog interface.
 */
export class ServiceLogImpl extends ServiceLog {
    #phase: 'pending' | 'active' | 'finished';
    #serviceId: number;
    #startTime: bigint;

    constructor(serviceId: number) {
        super();

        this.#phase = 'pending';
        this.#serviceId = serviceId;
        this.#startTime = 0n;
    }

    // ---------------------------------------------------------------------------------------------
    // ServiceLog implementation:
    // ---------------------------------------------------------------------------------------------

    beginExecution() {
        if (this.#phase !== 'pending')
            throw new Error('The service has already begun execution, unable to restart');

        this.#phase = 'active';
        this.#startTime = process.hrtime.bigint();

        this.state = 'success';
    }

    async finishExecution(): Promise<void> {
        if (this.#phase !== 'active')
            throw new Error('The service can only be marked as finished when execution is active');

        this.#phase = 'finished';

        const runtimeNanoseconds = process.hrtime.bigint() - this.#startTime;
        const runtimeMilliseconds = Number(runtimeNanoseconds) / 1000 / 1000;

        const messages = JSON.stringify([
            ...this.exceptions.map(({ error }) =>
                ({ type: 'exception', message: [ error.message, error.stack ] })),
            ...this.errors.map(({ data }) =>
                ({ type: 'error', message: data.map(String).join(', ') })),
            ...this.warnings.map(({ data }) =>
                ({ type: 'warning', message: data.map(String).join(', ') })),
        ]);

        await sql`
            INSERT INTO
                services_logs
                (service_id, service_log_result, service_log_runtime, service_log_data)
            VALUES
                (${this.#serviceId}, ${this.state}, ${runtimeMilliseconds}, ${messages})`;
    }
}

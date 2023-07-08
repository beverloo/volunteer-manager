// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Constructor } from '../lib/TypeUtilities';
import { type ServiceDriver, kServiceDriverConstructors } from './ServiceDriver';
import { type ServiceLog } from './ServiceLog';
import { type Service } from './Service';

import { ServiceLogImpl } from './ServiceLogImpl';
import { sql } from '../lib/database';

/**
 * The ServiceManager has to be initialized using the static CreateInstance() method, as its
 * configuration has to be loaded from the database.
 */
const kPrivateSymbol = Symbol();

/**
 * The ServiceManager is responsible for running the services known to the system, which are
 * activated through an API call that is expected to be made by an external system. It is
 * responsible for executing the services, as well as maintaining logs and sending warnings.
 */
export class ServiceManager {
    /**
     * Creates a new instance of the ServiceManager class. Configuration and state will be loaded
     * from the database prior to creating the instance.
     */
    static async CreateInstance() {
        const servicesWithState = await sql`
            SELECT
                services.service_id AS id,
                services.service_name AS name,
                services.service_event_id AS eventId,
                services.service_enabled AS enabled,
                services.service_interval AS 'interval',
                services.service_driver AS driver,
                services.service_params AS params,
                TIMESTAMPDIFF(
                    SECOND,
                    IFNULL(
                        MAX(services_logs.service_log_timestamp),
                        TIMESTAMPADD(SECOND, 0 - services.service_interval - 1, CURRENT_TIMESTAMP)),
                    CURRENT_TIMESTAMP) AS secondsSinceLastExecution
            FROM
                services
            LEFT JOIN
                services_logs ON services_logs.service_id = services.service_id
            GROUP BY
                services.service_id
            ORDER BY
                RAND()`;

        if (!servicesWithState.ok)
            return undefined;

        const services: Service<Constructor<ServiceDriver>>[] = [];
        for (const serviceWithState of servicesWithState.rows) {
            if (!Object.hasOwn(kServiceDriverConstructors, serviceWithState.driver))
                continue;

            services.push({
                ...serviceWithState as Service,
                driver: kServiceDriverConstructors[serviceWithState.driver],
            });
        }

        return new ServiceManager(kPrivateSymbol, services, ServiceLogImpl);
    }

    /**
     * Creates a new instance of the ServiceManager class intended for testing. Configuration must
     * be supplied when calling this method. A ServiceLog constructor must be passed in manually,
     * which will be used instead of the real implementation.
     */
    static CreateInstanceForTesting(
        services: Service<Constructor<ServiceDriver>>[],
        serviceLogConstructor: Constructor<ServiceLog>)
    {
        return new ServiceManager(kPrivateSymbol, services, serviceLogConstructor);
    }

    #serviceLogConstructor: Constructor<ServiceLog>;
    #services: Service<Constructor<ServiceDriver>>[];

    constructor(
        privateSymbol: Symbol, services: Service<Constructor<ServiceDriver>>[],
        serviceLogConstructor: Constructor<ServiceLog>)
    {
        if (privateSymbol !== kPrivateSymbol)
            throw new Error('Unable to instantiate the ServiceManager class, use CreateInstance()');

        this.#serviceLogConstructor = serviceLogConstructor;
        this.#services = services;
    }

    /**
     * Executes all services that are currently pending, according to their defined interval and
     * their last execution time. Optionally |force| can be set to ignore those criteria.
     */
    async execute(force?: boolean): Promise<boolean> {
        let failureSeen = false;

        for (const service of this.#services) {
            if (!service.enabled)
                continue;  // the service has been disabled

            if (service.secondsSinceLastExecution < service.interval && !force)
                continue;  // the service is not due to run yet

            if (!await this.executeSingle(service))
                failureSeen = true;
        }

        return !failureSeen;
    }

    /**
     * Executes a single |service|. A boolean will be returned that indicates whether execution of
     * the server completed without an error or exception.
     */
    async executeSingle(service: Service<Constructor<ServiceDriver>>): Promise<boolean> {
        const log = new this.#serviceLogConstructor(service.id);
        try {
            log.beginExecution();

            const instance = new service.driver();
            const params = JSON.parse(service.params);

            await instance.execute(log, params);

        } catch (error) {
            log.exception(error as Error);
        }

        await log.finishExecution();
        return log.success;
    }
}

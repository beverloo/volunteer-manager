// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Constructor } from '../lib/TypeUtilities';
import { type ServiceLog } from './ServiceLog';

import { DummyService } from './DummyService';

/**
 * Interface that each of the service driver implementations needs to adhere to.
 */
export interface IServiceDriver {
    /**
     * Execute the driver for the configured service. Warnings and errors should be logged to the
     * given |log|, which will automatically be finalized after finishing execution. The |params|
     * are included when they have been configured for the service.
     */
    execute(log: ServiceLog, params: any): Promise<void>;
}

/**
 * Object containing all constructors for the services that are known to the volunteer manager.
 */
export const kServiceDriverConstructors: { [key: string]: Constructor<IServiceDriver> } = {
    DummyService,
};

/**
 * Type containing the names of all known services in the environment. Automatically established
 * based on the driver definitions included above.
 */
export type ServiceDriver = keyof typeof kServiceDriverConstructors;

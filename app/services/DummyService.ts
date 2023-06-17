// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type IServiceDriver } from './ServiceDriver';
import { type Service } from './Service';
import { type ServiceLog } from './ServiceLog';

/**
 * Dummy implementation of a service driver.
 */
export class DummyService implements IServiceDriver {
    async execute(log: ServiceLog, params: any): Promise<void> {
        // implementation goes here
    }
}

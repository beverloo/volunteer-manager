// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type ServiceDriver } from './ServiceDriver';
import { type ServiceLog } from './ServiceLog';

/**
 * The parameters that are expected by the DummyService.
 */
interface DummyServiceParams { /* no parameters */ }

/**
 * Dummy implementation of a service driver.
 */
export class DummyService implements ServiceDriver<DummyServiceParams> {
    async execute(log: ServiceLog, params: DummyServiceParams): Promise<void> {
        // implementation goes here
    }
}

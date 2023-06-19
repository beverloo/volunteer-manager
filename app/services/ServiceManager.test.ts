// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Service } from './Service';
import { type DatabasePrimitive, kDatabase } from '../lib/database/Database';

import { Result } from '../lib/database/Result';
import { ServiceLogMock } from './ServiceLogMock';
import { ServiceManager } from './ServiceManager';

describe('ServiceManager', () => {
    afterEach(() => ServiceLogMock.Reset());

    it('passes', () => {

    });
});

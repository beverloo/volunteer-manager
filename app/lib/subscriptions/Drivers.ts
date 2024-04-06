// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Driver } from './Driver';

import { ApplicationDriver } from './drivers/ApplicationDriver';
import { RegistrationDriver } from './drivers/RegistrationDriver';
import { SubscriptionType } from '@lib/database/Types';

/**
 * The drivers that enable fanout of individual publications. Each driver must be an implementation
 * of the `Driver` type, and implement each of the messaging channels independently.
 */
export const kSubscriptionFactories = {
    [SubscriptionType.Application]: () => new ApplicationDriver,
    [SubscriptionType.Registration]: () => new RegistrationDriver,
} as const satisfies { [k in SubscriptionType]: () => Driver<any> };

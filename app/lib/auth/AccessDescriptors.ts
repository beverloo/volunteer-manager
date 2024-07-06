// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { BooleanPermission, CRUDPermission } from './Access';

/**
 * Comprehensive list of permissions that exist in the Volunteer Manager.
 */
type Permissions = BooleanPermission | CRUDPermission;

/**
 * Defines the information that must be known about each of the existing permissions. This helps to
 * provide the user interface through which permissions can be configured.
 */
interface AccessDescriptor {
    /**
     * Human-readable name given to the permission.
     */
    name: string;

    /**
     * Brief description explaining what the permission does.
     */
    description: string;

    /**
     * Whether the permission should be hidden from the user interface. Only for testing purposes,
     * all other permissions should be adequately presented.
     */
    hidden?: true;
}

/**
 * The list of descriptors that explain what permissions are available in the Volunteer Manager.
 */
export const kAccessDescriptors: { [k in Permissions]: AccessDescriptor } = {
    'event.visible': {
        name: 'Event visibility',
        description: 'Whether this event can be discovered by them in the user interface',
    },
    'test.boolean': {
        name: 'Test (boolean)',
        description: 'Boolean permission exclusively used for testing purposes',
        hidden: true,
    },
    'test.crud': {
        name: 'Test (CRUD)',
        description: 'CRUD permission exculsively used for testing purposes',
        hidden: true,
    },
};

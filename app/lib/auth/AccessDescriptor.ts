// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Describes a permission available in the Volunteer Manager. Permissions must have a type, a name
 * and a description, and can optionally have additional metadata associated too.
 */
export interface AccessDescriptor {
    /**
     * Human-readable name given to the permission.
     */
    name: string;

    /**
     * Brief description explaining what the permission does.
     */
    description: string;

    /**
     * Whether the permission should be hidden from the user interface.
     */
    hidden?: boolean;

    /**
     * Whether the applicable event must be specified when checking whether this permission has been
     * granted. May be set to `kAnyEvent` to pass when access to any event been granted.
     */
    requireEvent?: boolean;

    /**
     * Whether the applicable team must be specified when checking whether this permission has been
     * granted. May be set to `kAnyTeam` to pass when access to any team been granted.
     */
    requireTeam?: boolean;

    /**
     * Whether the permission is either granted or not granted ("boolean"), or has additional
     * granularity ("crud") for the Create, Read, Update and Delete operations.
     */
    type: 'boolean' | 'crud';
}

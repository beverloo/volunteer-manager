// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Utility function to concatenate a list of names. E.g.:
 *   [ "Joe" ]                      -> "Joe is"
 *   [ "Joe", "Sarah" ]             -> "Joe and Sarah are"
 *   [ "Joe", "Sarah", "Viola" ]    -> "Joe, Sarah and Viola are"
 */
export function concatenateNames(names: string[]): string {
    if (!names.length)
        return '';

    if (names.length === 1)
        return `${names[0]} is`;

    const sortedNames = [ ...names ].sort();

    const lastName = sortedNames.pop();
    return `${sortedNames.join(', ')} and ${lastName} are`;
}

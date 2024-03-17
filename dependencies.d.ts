// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

declare module 'simple-sha256' {
    // The synchronous function is wilfully omitted as it cannot be supported in both NodeJS and
    // browser environments, which would set us up for quite a vulnerable situation.
    export default function(input: string | Uint8Array): Promise<string>;
}

declare module 'set.prototype.symmetricdifference' {
    export default function<T>(set: Set<T>, otherSet: Set<T>): Set<T>;
}

// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { DefaultTypeAdapter, TypeAdapter } from 'ts-sql-query/TypeAdapter';

/**
 * Type adapter to translate between BLOB fields in the database and a JavaScript Uint8Array
 * representation.
 */
export const BlobTypeAdapter = new class implements TypeAdapter {
    transformValueFromDB(value: unknown, type: string, next: DefaultTypeAdapter): unknown {
        if (type === 'Blob') {
            if (value || value instanceof Uint8Array)
                return value ?? new Uint8Array();

            throw new Error(`Unable to decode a Blob field from the database: ${value}`);
        }

        return next.transformValueFromDB(value, type);
    }

    transformValueToDB(value: unknown, type: string, next: DefaultTypeAdapter): unknown {
        if (type === 'Blob') {
            if (value && !(value instanceof Uint8Array))
                throw new Error(`Unable to encode a Blob field to the database: ${value}`);

            return value ?? new Uint8Array();
        }

        return next.transformValueToDB(value, type);
    }
}

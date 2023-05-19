// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type DatabasePrimitive, kDatabase } from './Database';

// The implementation of the `sql` string template literal created by Malte for Vercel, modified
// to work with the |kDatabase| environment we use in this project.
//
// The implementation was made publicly available under an Apache 2 license, compatible with MIT.
// - https://github.com/vercel/storage/blob/main/packages/postgres/src/index.ts
// - https://github.com/vercel/storage/blob/main/packages/postgres/src/sql-template.ts
export function sql(strings: TemplateStringsArray, ...parameters: DatabasePrimitive[]) {
    if (!isTemplateStringsArray(strings) || !Array.isArray(parameters))
        throw new Error('Cannot call sql() as a function, use it as a tagged string template.');

    let query = strings[0] ?? '';
    for (let i = 1; i < strings.length; ++i)
        query += `?${strings[i] ?? ''}`;

    return kDatabase.query(query, parameters);
}

function isTemplateStringsArray(strings: unknown): strings is TemplateStringsArray {
    return Array.isArray(strings) && 'raw' in strings && Array.isArray(strings.raw);
}

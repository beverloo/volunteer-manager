// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type DatabasePrimitive, kDatabase } from './Database';
import { Result } from './Result';
import { sql } from './index';

describe('Database', () => {
    afterEach(() => kDatabase.setDelegateForTesting(/* reset= */ undefined));

    it('is able to separate the query from parameters in the string template literal', async () => {
        let latestQuery: string | undefined;
        let latestParameters: DatabasePrimitive[] | undefined;

        kDatabase.setDelegateForTesting({
            async query(query: string, parameters?: DatabasePrimitive[]): Promise<Result> {
                latestQuery = query;
                latestParameters = parameters;

                return Result.createErrorForTesting();
            }
        });

        const table = 'myTable';
        const result = await sql`SELECT * FROM ${table} WHERE ${0 + 1}`;

        expect(result.ok).toBeFalsy();

        expect(latestQuery).toBe('SELECT * FROM ? WHERE ?');
        expect(latestParameters).toEqual([
            'myTable',
            1,
        ]);
    });
});

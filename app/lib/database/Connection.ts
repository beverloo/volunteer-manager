// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { MariaDBConnection } from 'ts-sql-query/connections/MariaDBConnection';
import { MariaDBPoolQueryRunner } from 'ts-sql-query/queryRunners/MariaDBPoolQueryRunner';
import { MariaDBQueryRunner } from 'ts-sql-query/queryRunners/MariaDBQueryRunner';
import { type Pool, type PoolConfig, type SqlError, createPool } from 'mariadb';
import { type QueryType, MockQueryRunner } from 'ts-sql-query/queryRunners/MockQueryRunner';

import { Log, LogType, LogSeverity } from '@lib/Log';

/**
 * The MariaDB connection pool configuration that should be used for the Volunteer Manager.
 */
const kConnectionPoolConfig: PoolConfig = {
    host: process.env.APP_DATABASE_SERVER,
    port: parseInt(process.env.APP_DATABASE_PORT!),
    user: process.env.APP_DATABASE_USERNAME,
    password: process.env.APP_DATABASE_PASSWORD,
    database: process.env.APP_DATABASE_NAME,

    connectionLimit: 5,
    idleTimeout: /* seconds= */ 15,
    minimumIdle: 1,
};

/**
 * The DBConnection class encapsulates the pooled connection to the MariaDB / MySQL server that the
 * Volunteer Manager will use. Queries can be executed by using the `sql` template literal tag,
 * which automatically turns a query in a native MySQL parameterized query to prevent SQL
 * injections. Alternatively (and recommended) is use of the query building facilities.
 */
export class DBConnection extends MariaDBConnection<'DBConnection'> {
    /**
     * Allow empty strings to be passed. Without this setting `ts-sql-query` will use NULL instead.
     */
    override allowEmptyString = true;

    /**
     * Global type adapter (MariaDB -> TypeScript) for the custom types that we use.
     */
    protected override transformValueFromDB(value: unknown, type: string) {
        switch (type) {
            case 'Blob':
                if (value || value instanceof Uint8Array)
                    return value ?? new Uint8Array();

                throw new Error(`Unable to decode a Blob field from the database: ${value}`);
        }

        return super.transformValueFromDB(value, type);
    }

    /**
     * Global type adapter (TypeScript -> MariaDB) for the custom types that we use.
     */
    protected override transformValueToDB(value: unknown, type: string) {
        switch (type) {
            case 'Blob':
                if (value && !(value instanceof Uint8Array))
                    throw new Error(`Unable to encode a Blob field to the database: ${value}`);

                return value ?? new Uint8Array();
        }

        return super.transformValueToDB(value, type);
    }
}

/**
 * Extended implementation of `MariaDBQueryRunner` that overrides the three methods directly
 * executing queries on the underlying MariaDB connection. We then capture errors on those.
 *
 * @see https://github.com/juanluispaz/ts-sql-query/blob/master/src/queryRunners/MariaDBQueryRunner.ts
 */
class QueryRunner extends MariaDBQueryRunner {
    private handleErrorAndRethrowException(error: SqlError): never {
        if (!error.message.includes('database-error')) {
            Log({
                type: LogType.DatabaseError,
                severity: LogSeverity.Error,
                data: {
                    message: error.message,
                    query: error.sql,
                },
            });
        }

        throw error;
    }

    protected override executeQueryReturning(query: string, params: any[]): Promise<any[]> {
        return super.executeQueryReturning(query, params).catch(error =>
            this.handleErrorAndRethrowException(error));
    }

    protected override executeMutation(query: string, params: any[]): Promise<number> {
        return super.executeMutation(query, params).catch(error =>
            this.handleErrorAndRethrowException(error));
    }

    override executeInsertReturningLastInsertedId(query: string, params: any[] = []): Promise<any> {
        return super.executeInsertReturningLastInsertedId(query, params).catch(error =>
            this.handleErrorAndRethrowException(error));
    }
}

/**
 * Extended implementation of `MariaDBPoolQueryRunner` that returns our own query runner as opposed
 * to the default `MariaDBQueryRunner`, to add instrumentation towards holistically logging errors.
 */
class PoolQueryRunner extends MariaDBPoolQueryRunner {
    protected override createQueryRunner(): Promise<QueryRunner> {
        return this.pool.getConnection().then(mariaDBConnection =>
            new QueryRunner(mariaDBConnection, this.database as any));
    }
}

/**
 * The query runner that powers connection coming from the Volunteer Manager. Lazily initialized the
 * first time a connection is requested.
 */
export let globalConnectionPool: Pool | undefined;

/**
 * Global mock connection that can be created (& destroyed) using the `useMockConnection` function
 * in tests. The `db` global will seamlessly be overridden when this machinery is in place.
 */
let globalMockConnection: DBConnection | undefined;

/**
 * The global connection that should be used by the Volunteer Manager. The connection pool is lazily
 * initialized on first use, whereas a new `DBConnection` instance will be returned for each query
 * that is being executed. This allows us to run multiple queries in parallel, pool limits allowing.
 */
export const globalConnection = new Proxy<DBConnection>({ /* unused */ } as any, new class {
    #instance?: DBConnection = undefined;
    get(target: DBConnection, property: string | symbol, receiver: any) {
        if (globalMockConnection)
            return Reflect.get(globalMockConnection, property);

        if (!globalConnectionPool)
            globalConnectionPool = createPool(kConnectionPoolConfig);

        const localConnection = new DBConnection(new PoolQueryRunner(globalConnectionPool));
        return Reflect.get(localConnection, property);
    }
});

/**
 * Method that can be used in testing environments to use a mock connection for the entire test
 * suite. Must be called in the `describe()` section of a test suite.
 *
 * Usage is straightforward: each test must declare the database queries that it expects to be
 * executed, and has a choice of mocking the result or ignoring it, which will yield a null result.
 *
 * Example:
 * ```
 * describe('MyTestSuite', () => {
 *   const mockConnection = useMockConnection();
 *   it('is supposed to store a new Pokémon in the database', async () => {
 *     mockConnection.expect('insertInto', (query, params) => 42);
 *     await db.insertInto(...);
 *   });
 * });
 * ```
 *
 * It is not allowed for queries to execute during a test which were not declared, nor is it allowed
 * to declare queries that are expected to execute which then do not execute. Both will cause the
 * test to fail.
 */
export function useMockConnection() {
    type MockConnectionExpectCallback = (query: string, params: any[]) => any;

    const mockConnectionQueue: { type: string, callback?: MockConnectionExpectCallback }[] = [];
    const mockConnection = new class {
        /**
         * Returns the DBConnection instance that is available during the test. Each individual test
         * will return a difference instance, so do not expect stability.
         */
        get connection() { return globalMockConnection!; }

        /**
         * Expects a query of the given `type` to be executing next in order. When this is the case,
         * the `callback` will be invoked with the given `query` and `params`. The expected return
         * type should be returned, which is dependent on the query and its expected outcome.
         */
        expect(type: QueryType, callback?: MockConnectionExpectCallback) {
            mockConnectionQueue.push({ type, callback });
        }
    };

    beforeEach(() => {
        mockConnectionQueue.splice(0, mockConnectionQueue.length);
        globalMockConnection = new DBConnection(new MockQueryRunner(
            (queryType: QueryType, query: string, params: any[], index: number) => {
                expect(mockConnectionQueue.length).toBeGreaterThan(0);

                const { type, callback } = mockConnectionQueue.shift()!;
                expect(type).toEqual(queryType);

                return callback ? callback.call(/* thisArg= */ null, query, params)
                                : null;
            }));
    });

    afterEach(() => {
        globalMockConnection = undefined;
        expect(mockConnectionQueue).toHaveLength(0);
    });

    return mockConnection;
}

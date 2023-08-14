// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { MariaDBPoolQueryRunner } from 'ts-sql-query/queryRunners/MariaDBPoolQueryRunner';
import { MariaDBConnection } from 'ts-sql-query/connections/MariaDBConnection';
import { createPool } from 'mariadb';

/**
 * The MariaDB connection pool that should be used for the Volunteer Manager.
 */
const kConnectionPool = createPool({
    host: process.env.APP_DATABASE_SERVER,
    port: parseInt(process.env.APP_DATABASE_PORT!),
    user: process.env.APP_DATABASE_USERNAME,
    password: process.env.APP_DATABASE_PASSWORD,
    database: process.env.APP_DATABASE_NAME,

    connectionLimit: 5,
    idleTimeout: /* minutes= */ 15,
});

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
    allowEmptyString = true;
}

/**
 * The global connection that should be used by the Volunteer Manager.
 */
export const kConnection = new DBConnection(new MariaDBPoolQueryRunner(kConnectionPool));

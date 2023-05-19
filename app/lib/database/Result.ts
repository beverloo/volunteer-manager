// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { MysqlError, OkPacket } from 'mysql';

/**
 * Enumeration containing all the types of results that the Result class can represent.
 */
enum ResultType {
    Error,
    Select,
    Update,
};

/**
 * Wraps the mysqljs/mysql library's query() method into something that can be mapped to a known
 * data type.
 */
export class Result {
    /**
     * Creates a new Result instance based on the given |queryPromise|, which is the value returned
     * by calling Database.query() and the underlying Connection.query() methods.
     *
     * @param queryPromise The result parameter given to us by the MySQL library.
     * @return An instance of the Result class representing this result.
     */
    static async from(queryPromise: Promise<unknown>): Promise<Result> {
        try {
            const queryResult = await queryPromise;
            if (Array.isArray(queryResult))
                return new Result(ResultType.Select, queryResult);

            if (typeof queryResult === 'object' && Object.hasOwn(queryResult, 'affectedRows'))
                return new Result(ResultType.Update, queryResult);

            throw new Error('Unrecognised result from the MySQL library:', queryResult);

        } catch (error) {
            return new Result(ResultType.Error, error);
        }
    }

    private resultType: ResultType;
    private resultValue: unknown;

    constructor(resultType: ResultType, resultValue: unknown) {
        this.resultType = resultType;
        this.resultValue = resultValue;
    }

    /**
     * Whether the query was able to execute without raising an error.
     */
    get ok() { return this.resultType !== ResultType.Error; }

    /**
     * Returns the type of result that this instance is representing.
     */
    get type() { return this.resultType; }

    // ---------------------------------------------------------------------------------------------
    // ResultType.Error
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns the MySQLError instance of the error that occurred while executing this query.
     */
    get error() {
        if (this.resultType !== ResultType.Error)
            throw new Error('Result::error is only available for queries that errored out.');

        return this.resultValue as MysqlError;
    }

    // ---------------------------------------------------------------------------------------------
    // ResultType.Select
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns an array with the rows of information that have been retrieved from the server. This
     * method will raise an exception when it's called for anything that's not a SELECT query.
     */
    get rows() {
        if (this.resultType !== ResultType.Select)
            throw new Error('Result::rows is only available for successful SELECT queries.')

        return this.resultValue as Array<{ [key: string]: any }>;
    }

    // ---------------------------------------------------------------------------------------------
    // ResultType.Update
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns the number of rows that were affected by the executed query. This method will raise
     * an exception when it's called for anything that's not an INSERT, UPDATE or DELETE query.
     */
    get affectedRows() {
        if (this.resultType !== ResultType.Update)
            throw new Error('Result::affectedRows is only available for successful updates.');

        return (this.resultValue as OkPacket).affectedRows;
    }

    /**
     * Returns the unique Id of the row that was inserted in the database, if the table has a column
     * that's an automatically incrementing primary index. This method will raise an exception when
     * it's called for anything that's not an INSERT, UPDATE or DELETE query.
     */
    get insertId() {
        if (this.resultType !== ResultType.Update)
            throw new Error('Result::insertId is only available for successful updates.');

        return (this.resultValue as OkPacket).insertId;
    }
}

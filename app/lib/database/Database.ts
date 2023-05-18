// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Connection, MysqlError } from 'mysql';
import ServerlessMySQL from 'serverless-mysql';

/**
 * Symbol to avoid anyone from instantiating the Database class directly.
 */
const kPrivateSymbol = Symbol();

/**
 * Wraps the `serverless-mysql` library for database access provided on the server. The library
 * manages connection management and scaling, automatically reestablishes the connection when it's
 * lost. This class abstracts that away from our server infrastructure.
 */
export class Database {
    private connection: ServerlessMySQL.ServerlessMysql;

    constructor(privateSymbol: Symbol) {
        if (privateSymbol !== kPrivateSymbol)
            throw new Error('Unable to instantiate the Database class, use `kDatabase` instead.');

        this.connection = ServerlessMySQL({
            backoff: 'full',
            base: 8,
            cap: 30000, // 30 seconds

            config: {
                host: process.env.APP_DATABASE_SERVER,
                port: parseInt(process.env.APP_DATABASE_PORT),
                user: process.env.APP_DATEBASE_USERNAME,
                password: process.env.APP_DATABASE_PASSWORD,
                database: process.env.APP_DATABASE_NAME
            },

            onError: Database.prototype.onError.bind(this),
            onClose: Database.prototype.onClose.bind(this),
            onConnect: Database.prototype.onConnect.bind(this),
            onConnectError: Database.prototype.onConnectError.bind(this),
            onRetry: Database.prototype.onRetry.bind(this),
        });
    }

    /**
     * Called when a connection with the server has been established.
     */
    private onConnect(connection: Connection): void {
        console.log(`[MySQL] Connection to ${connection.config.host} has been established.`);
    }

    /**
     * Called when a connection with the server could not be established.
     */
    private onConnectError(error: MysqlError): void {
        console.log('[MySQL] Connection could not be established:', error);
    }

    /**
     * Called when a connection with the server has been closed.
     */
    private onClose(): void {
        console.log('[MySQL] Connection with the server has been closed.');
    }

    /**
     * Called when an error has occurred while using one of the established connections.
     */
    private onError(error: MysqlError): void {
        console.log('[MySQL] An error occurred:', error);
    }

    /**
     * Called when a connection attempt is being retried.
     */
    private onRetry(error: MysqlError, retries: number, delay: number, backoffType: string): void {
        console.log('[MySQL] Connection to the server is being retried.');
    }
}

/**
 * Shared database instance for the server that provides direct access to our MySQL database.
 * Connection information is provided through the `.env.development` and `.env.production` files.
 */
export const kDatabase = new Database(kPrivateSymbol);

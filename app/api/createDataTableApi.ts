// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest, NextResponse } from 'next/server';
import { type AnyZodObject, type ZodTypeAny, ZodBoolean, ZodNever, z, type ZodNeverDef } from 'zod';

import { type ActionProps, executeAction } from './Action';

/**
 * Response that is expected when an error occurred and the operation could not be fulfilled. The
 * `success` member will be set to `false`, and optionally an error may be provided.
 */
type DataTableHandlerErrorResponse = {
    /**
     * Whether the operation could be completed successfully.
     */
    success: false;

    /**
     * Error message to present to the user, when applicable.
     */
    error?: string;
};

/**
 * The context that's common across Data Table API endpoints. The `context` member will be omitted
 * when ZodNever is used instead of a more descriptive context type.
 */
type DataTableContext<Context extends ZodTypeAny> =
    Context extends ZodNever ? { /* omit the context */ } : { context: z.infer<Context> };

/**
 * Request and response expected for GET requests with the purpose of listing rows.
 */
type DataTableListHandlerRequest<RowModel extends AnyZodObject,
                                 Context extends ZodTypeAny> = /* DataTableContext<Context> & */ {
    // TODO: filtering
    // TODO: pagination

    /**
     * Sort that should be applied to the data. Must be complete when included.
     */
    sort?: {
        /**
         * Field on which the results should be sorted. These must be included in the `RowModel`.
         */
        field: keyof z.infer<RowModel>;

        /**
         * Direction in which the results should be sorted.
         */
        sort: 'asc' | 'desc' | null;
    };
};

type DataTableListHandlerResponse<RowModel extends AnyZodObject> = DataTableHandlerErrorResponse | {
    /**
     * Whether the operation could be completed successfully.
     */
    success: true,

    /**
     * The total number of rows that are available in the database, considering any filter rules.
     */
    rowCount: number;

    /**
     * The rows to display in the current DataTable view, considering pagination.
     */
    rows: z.infer<RowModel>[];
};

/**
 * `callApi()` compatible endpoint definition for DataTable List requests.
 */
export type DataTableListEndpoint<RowModel extends AnyZodObject, Context extends ZodTypeAny> = {
    request: DataTableListHandlerRequest<RowModel, Context>,
    response: DataTableListHandlerResponse<RowModel>,
};

/**
 * Abstract interface describing the Data Table API that has to be implemented by each customer.
 */
export interface DataTableApi<RowModel extends AnyZodObject, Context extends ZodTypeAny> {
    /**
     * Execute an access check for the given `action`. The `props` and `context` may be consulted
     * if necessary. This call will be _awaited_ for, and can also return synchronously.
     */
    accessCheck?(action: 'list', props: ActionProps): Promise<void> | void;

    // TODO: create
    // TODO: delete

    /**
     * Implements the ability to retrieve the rows that should be displayed in the data table. The
     * `request` includes the necessary parameters to support filtering, pagination and sorting.
     *
     * @handles `/endpoint`
     */
    list(request: DataTableListHandlerRequest<RowModel, Context>, props: ActionProps)
        : Promise<DataTableListHandlerResponse<RowModel>>;

    // TODO: update
    // TODO: writeLog
}

/**
 * Parameters that are passed by Next.js to route handlers.
 */
type DataTableApiHandlerParams = { params: { [key: string]: string | string[] } };

/**
 * Signature of an individual route handler provided by this mechanism.
 */
type DataTableApiHandler =
    (request: NextRequest, params: DataTableApiHandlerParams) => Promise<Response>;

/**
 * Signature returned by the `createDataTableApi()` function, which provides generated functions
 * that can be exported from the route handler of one of these APIs.
 */
type DataTableApiHandlers = {
    //DELETE: (request: NextRequest, params: DataTableApiHandlerParams) => Promise<Response>;
    GET: (request: NextRequest, params: DataTableApiHandlerParams) => Promise<Response>;
    //POST: (request: NextRequest, params: DataTableApiHandlerParams) => Promise<Response>;
    //PUT: (request: NextRequest, params: DataTableApiHandlerParams) => Promise<Response>;
}

/**
 * Retrieves a strongly typed array of the keys included in the given `obj`.
 * @see https://github.com/colinhacks/zod/discussions/839
 */
function getTypedObjectKeys<K extends string>(obj: Record<K, any>): K[] {
    return Object.keys(obj) as K[];
}

/**
 * Creates the routing implementation for a DataTable API handler. Creates the route handlers as are
 * needed for the `DELETE`, `GET`, `POST` and `PUT` request methods.
 *
 * @param rowModel Zod definition of an individual row this API will deal with.
 * @param context Zod definition of the context used by the implementation. Use `z.never()` to omit.
 * @param implementation Implementation of the Data Table API specific to this type.
 */
export function createDataTableApi<RowModel extends AnyZodObject, Context extends ZodTypeAny>(
    rowModel: RowModel,
    context: Context,
    implementation: DataTableApi<RowModel, Context>): DataTableApiHandlers
{
    const zErrorResponse = z.object({
        success: z.literal(false),
        error: z.string().optional(),
    });

    // ---------------------------------------------------------------------------------------------
    // DELETE
    // ---------------------------------------------------------------------------------------------
    // TODO

    // ---------------------------------------------------------------------------------------------
    // GET
    // ---------------------------------------------------------------------------------------------

    const getInterface = z.object({
        request: z.object({
            // TODO: context
            // TODO: filtering
            // TODO: pagination
            sort: z.object({
                field: z.enum([
                    getTypedObjectKeys(rowModel.shape)[0],
                    ...getTypedObjectKeys(rowModel.shape)
                ]),
                sort: z.enum([ 'asc', 'desc' ]).nullable(),
            }).optional(),
        }),
        response: z.discriminatedUnion('success', [
            zErrorResponse,
            z.object({
                success: z.literal(true),
                rowCount: z.number(),
                rows: z.array(rowModel),
            }),
        ]),
    });

    const GET: DataTableApiHandler = async(request, { params }) => {
        return executeAction(request, getInterface, async (innerRequest, props) => {
            await implementation.accessCheck?.('list', props);
            return implementation.list(innerRequest, props);
        }, params);
    };

    // ---------------------------------------------------------------------------------------------
    // POST
    // ---------------------------------------------------------------------------------------------
    // TODO

    // ---------------------------------------------------------------------------------------------
    // PUT
    // ---------------------------------------------------------------------------------------------
    // TODO

    return { GET };
}

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { NextRequest } from 'next/server';

import { type AnyZodObject, type ZodTypeAny, ZodNever, z } from 'zod';

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
    { /* TODO: Support context */ };

/**
 * Request and response expected for POST requests with the purpose of creating rows.
 */
type DataTableCreateHandlerRequest<Context extends ZodTypeAny> = DataTableContext<Context> & {};
type DataTableCreateHandlerResponse<RowModel extends AnyZodObject> = DataTableHandlerErrorResponse |
    {
        /**
         * Whether the operation could be completed successfully.
         */
        success: true;

        /**
         * The row that was created. Follows the `RowModel`, but requires an ID to be set.
         */
        row: z.infer<RowModel> & { id: number };
    };

/**
 * Request and response expected for DELETE requests with the purpose of deleting rows.
 */
type DataTableDeleteHandlerRequest<Context extends ZodTypeAny> = DataTableContext<Context> & {
    /**
     * Unique ID of the row that's about to be deleted.
     */
    id: number;
};

type DataTableDeleteHandlerResponse = DataTableHandlerErrorResponse | {
    /**
     * Whether the operation could be completed successfully.
     */
    success: true,
};

/**
 * Request and response expected for GET requests with the purpose of listing rows.
 */
type DataTableListHandlerRequest<RowModel extends AnyZodObject,
                                 Context extends ZodTypeAny> = DataTableContext<Context> & {
    /**
     * Pagination that should be applied to the row selection.
     */
    pagination?: {
        /**
         * Current page number to display. Zero-based, i.e. the first page is page 0.
         */
        page: number;

        /**
         * The number of rows that should be displayed per table.
         */
        pageSize: number;
    };

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
     * The total number of rows that are available in the database.
     */
    rowCount: number;

    /**
     * The rows to display in the current Data Table view, considering pagination.
     */
    rows: z.infer<RowModel>[];
};

/**
 * Request and response expected for PUT requests with the purpose of updating rows.
 */
type DataTableUpdateHandlerRequest<RowModel extends AnyZodObject,
                                   Context extends ZodTypeAny> = DataTableContext<Context> & {
    /**
     * Unique ID of the row that's about to be updated. Also contained within the `row`, whereas it
     * has been verified that the values are identical.
     */
    id: number;

    /**
     * The row that should be updated.
     */
    row: z.infer<RowModel> & { id: number; };
};

type DataTableUpdateHandlerResponse = DataTableHandlerErrorResponse | {
    /**
     * Whether the operation could be completed successfully.
     */
    success: true,
};

/**
 * `callApi()` compatible endpoint definitions for the generated APIs.
 */
export type DataTableEndpoints<RowModel extends AnyZodObject, Context extends ZodTypeAny> = {
    create: {
        request: DataTableCreateHandlerRequest<Context>,
        response: DataTableCreateHandlerResponse<RowModel>,
    },
    delete: {
        request: DataTableDeleteHandlerRequest<Context>,
        response: DataTableDeleteHandlerResponse,
    },
    list: {
        request: DataTableListHandlerRequest<RowModel, Context>,
        response: DataTableListHandlerResponse<RowModel>,
    },
    update: {
        request: DataTableUpdateHandlerRequest<RowModel, Context>,
        response: DataTableUpdateHandlerResponse,
    },
};

/**
 * Abstract interface describing the Data Table API that has to be implemented by each customer.
 */
export interface DataTableApi<RowModel extends AnyZodObject, Context extends ZodTypeAny> {
    /**
     * Execute an access check for the given `action`. The `props` and `context` may be consulted
     * if necessary. This call will be _awaited_ for, and can also return synchronously.
     */
    accessCheck?(request: DataTableContext<Context>,
                 action: 'create' | 'delete' | 'list' | 'update', props: ActionProps)
        : Promise<void> | void;

    /**
     * Creates a new row in the database, and returns the `RowModel` for the new row. An ID must
     * be included as it's expected by the `<RemoteDataTable>` interface.
     */
    create?(request: DataTableCreateHandlerRequest<Context>, props: ActionProps)
        : Promise<DataTableCreateHandlerResponse<RowModel>>;

    /**
     * Deletes the row included in the `request`. Delete actions return no data other than a success
     * flag, and optionally a message when an error occurs.
     */
    delete?(request: DataTableDeleteHandlerRequest<Context>, props: ActionProps)
        : Promise<DataTableDeleteHandlerResponse>;

    /**
     * Implements the ability to retrieve the rows that should be displayed in the data table. The
     * `request` includes the necessary parameters to support pagination and sorting.
     *
     * @handles `/endpoint`
     */
    list(request: DataTableListHandlerRequest<RowModel, Context>, props: ActionProps)
        : Promise<DataTableListHandlerResponse<RowModel>>;

    /**
     * Updates a given row in the database. The full to-be-updated row must be given, including the
     * fields that are not editable. The row ID is mandatory in this request.
     */
    update?(request: DataTableUpdateHandlerRequest<RowModel, Context>, props: ActionProps)
        : Promise<DataTableUpdateHandlerResponse>;

    /**
     * Called when a mutation has occurred in case the implementation wants to log the fact that
     * this action has taken place. This call will be _awaited_ for.
     */
    writeLog?(request: any, mutation: 'Created' | 'Deleted' | 'Updated', props: ActionProps)
        : Promise<void> | void;
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
    DELETE: (request: NextRequest, params: DataTableApiHandlerParams) => Promise<Response>;
    GET: (request: NextRequest, params: DataTableApiHandlerParams) => Promise<Response>;
    POST: (request: NextRequest, params: DataTableApiHandlerParams) => Promise<Response>;
    PUT: (request: NextRequest, params: DataTableApiHandlerParams) => Promise<Response>;
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

    const deleteInterface = z.object({
        request: z.object({
            id: z.coerce.number(),
            // TODO: context
        }),
        response: z.discriminatedUnion('success', [
            zErrorResponse,
            z.object({
                success: z.literal(true),
            }),
        ]),
    });

    const DELETE: DataTableApiHandler = async(request, { params }) => {
        return executeAction(request, deleteInterface, async (innerRequest, props) => {
            if (!implementation.delete)
                throw new Error('Cannot handle DELETE requests without a delete handler');

            await implementation.accessCheck?.(innerRequest, 'delete', props);

            const response = await implementation.delete(innerRequest, props);
            if (response.success)
                await implementation.writeLog?.(innerRequest, 'Deleted', props);

            return response;
        }, params);
    };

    // ---------------------------------------------------------------------------------------------
    // GET
    // ---------------------------------------------------------------------------------------------

    const getInterface = z.object({
        request: z.object({
            // TODO: context
            pagination: z.object({
                page: z.coerce.number(),
                pageSize: z.enum([ '10', '25', '50', '100' ]).transform(v => parseInt(v)),
            }).optional(),
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
            await implementation.accessCheck?.(innerRequest, 'list', props);
            return implementation.list(innerRequest, props);
        }, params);
    };

    // ---------------------------------------------------------------------------------------------
    // POST
    // ---------------------------------------------------------------------------------------------

    const postInterface = z.object({
        request: z.object({
            // TODO: context
        }),
        response: z.discriminatedUnion('success', [
            zErrorResponse,
            z.object({
                success: z.literal(true),
                row: rowModel.and(z.object({ id: z.number() }))
            }),
        ]),
    });

    const POST: DataTableApiHandler = async(request, { params }) => {
        return executeAction(request, postInterface, async (innerRequest, props) => {
            if (!implementation.create)
                throw new Error('Cannot handle POST requests without a create handler');

            await implementation.accessCheck?.(innerRequest, 'create', props);

            const response = await implementation.create(innerRequest, props);
            if (response.success)
                await implementation.writeLog?.(innerRequest, 'Created', props);

            return response;
        }, params);
    };

    // ---------------------------------------------------------------------------------------------
    // PUT
    // ---------------------------------------------------------------------------------------------

    const putInterface = z.object({
        request: z.object({
            id: z.coerce.number(),
            // TODO: context
            row: rowModel.required().and(z.object({ id: z.number() })),
        }),
        response: z.discriminatedUnion('success', [
            zErrorResponse,
            z.object({
                success: z.literal(true),
            }),
        ]),
    });

    const PUT: DataTableApiHandler = async(request, { params }) => {
        return executeAction(request, putInterface, async (innerRequest, props) => {
            if (!implementation.update)
                throw new Error('Cannot handle PUT requests without an update handler');

            if (innerRequest.id !== innerRequest.row.id)
                throw new Error('ID mismatch between the route and the contained row');

            await implementation.accessCheck?.(innerRequest, 'update', props);

            const response = await implementation.update(innerRequest, props);
            if (response.success)
                await implementation.writeLog?.(innerRequest, 'Updated', props);

            return response;
        }, params);
    };

    return { DELETE, GET, POST, PUT };
}

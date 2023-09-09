// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Props accepted by the NextJS router component.
 */
export interface NextRouterParams<SingleComponentParams extends string,
                                  MultiComponentParams extends string = never>
{
    /**
     * Parameters passed to the component by the NextJS router.
     */
    params: {
        /**
         * Parameter that was included in the URL.
         */
        [P in SingleComponentParams]: string;
    } & {
        /**
         * Parameters that were included in the URL.
         */
        [P in MultiComponentParams]?: string[];
    } & {
        /**
         * Search parameters given in the URL.
         */
        searchParams: Record<string, string>;
    };
}

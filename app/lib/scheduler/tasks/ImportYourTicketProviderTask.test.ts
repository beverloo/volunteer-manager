// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { useMockConnection } from '@lib/database/Connection';

describe('ImportYourTicketProviderTask', () => {
    const mockConnection = useMockConnection();

    it('should skip when there are no upcoming festivals', async () => {
        // TODO
    });

    it('should scale the task interval based on duration until the festival', async () => {
        // TODO
    });

    it('should upsert information retrieved from the API in the database', async () => {
        // TODO
    });

    it('should update the product description when it changed', async () => {
        // TODO
    });

    it('should update maximum ticket information in the database when it changed', async () => {
        // TODO
    });
});

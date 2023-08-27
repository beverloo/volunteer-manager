// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import fs from 'fs/promises';
import path from 'path';

import { kActivitiesDefinition } from './ClientTypes';

describe('Types', () => {
    it('is able to validate the AnimeCon 2023 program', async () => {
        const conventionDataRaw =
            await fs.readFile(path.resolve(__dirname, './test/animecon-2023.json'), 'utf8');

        const conventionDataJson = JSON.parse(conventionDataRaw);
        expect(kActivitiesDefinition.safeParse(conventionDataJson).success).toBeTruthy();
    });

    it('is able to validate the AnimeCon 2022: Classic program', async () => {
        const conventionDataRaw =
            await fs.readFile(path.resolve(__dirname, './test/animecon-2022-classic.json'), 'utf8');

        const conventionDataJson = JSON.parse(conventionDataRaw);
        expect(kActivitiesDefinition.safeParse(conventionDataJson).success).toBeTruthy();
    });

    it('is able to validate the AnimeCon 2022 program', async () => {
        const conventionDataRaw =
            await fs.readFile(path.resolve(__dirname, './test/animecon-2022-regular.json'), 'utf8');

        const conventionDataJson = JSON.parse(conventionDataRaw);
        expect(kActivitiesDefinition.safeParse(conventionDataJson).success).toBeTruthy();
    });
});

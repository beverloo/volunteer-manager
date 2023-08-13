// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { type Metadata } from 'next';

import { UnderConstructionPaper } from '@app/admin/UnderConstructionPaper';

export default async function EventTrainingPage(props: any) {
    return (
        <UnderConstructionPaper>
            Training
        </UnderConstructionPaper>
    );
}

export const metadata: Metadata = {
    title: 'Event | Training',
};
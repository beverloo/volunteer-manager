// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { RegistrationLayout } from '../RegistrationLayout';
import { getRequestEnvironment } from '../../lib/getRequestEnvironment';

export default async function EventRegistrationPage({ params }) {
    const environment = getRequestEnvironment();

    return (
        <RegistrationLayout environment={environment}>
            Path: <b>{params.path?.join('/')}</b>
        </RegistrationLayout>
    );
}

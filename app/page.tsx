// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { WelcomePage } from './welcome/WelcomePage';

import { RegistrationLayout } from './registration/RegistrationLayout';
import { getEventsForUser } from './lib/EventLoader';
import { useUser } from './lib/auth/useUser';

export default async function RootPage() {
    const user = await useUser('ignore');
    const events = await getEventsForUser(user);
    const eventDatas = events.map(event => event.toEventData());

    return (
        <RegistrationLayout environment="stewards.team">
            <WelcomePage events={eventDatas} user={user?.toUserData()} />
        </RegistrationLayout>
    );
}

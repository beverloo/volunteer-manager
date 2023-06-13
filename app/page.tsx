// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { WelcomePage } from './welcome/WelcomePage';

import { getEventBySlug, getEventsForUser } from './lib/EventLoader';
import { useUser } from './lib/auth/useUser';

export default async function RootPage() {
    const user = await useUser('ignore');
    const events = await getEventsForUser(user);
    const eventDatas = events.map(event => event.toEventData());

    return (
        <WelcomePage events={eventDatas} user={user?.toUserData()} />
    );
}

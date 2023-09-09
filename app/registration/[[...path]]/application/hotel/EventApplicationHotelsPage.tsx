// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { EventPageProps } from '../../EventPageProps';

/**
 * The <EventApplicationHotelsPage> component serves the ability for users to select which hotel
 * they would like to stay in during the event. Not all volunteers have the ability to make this
 * selection, as the number of available hotel rooms is limited.
 */
export async function EventApplicationHotelsPage(props: EventPageProps</* UserRequired= */ true>) {
    return (
        <p>Hello, world!</p>
    );
}

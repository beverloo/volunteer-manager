// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Stack from '@mui/material/Stack';

import { DisplayContainer } from './DisplayContainer';
import { DisplayHeader } from './DisplayHeader';
import { DisplayTheme } from './DisplayTheme';

/**
 * The <DisplayLayout> component is the root layout of the Volunteer Manager Display, which shows
 * the System UI substitute and the container within which the content is displayed. Most of the
 * interaction with the device—including the ability to request help—will be provided here.
 */
export default function DisplayLayout(props: React.PropsWithChildren) {
    return (
        <DisplayTheme>
            <Stack direction="column" spacing={4} sx={{ p: 4, height: '100%' }}>
                <DisplayHeader />
                <DisplayContainer>
                    {props.children}
                </DisplayContainer>
            </Stack>
        </DisplayTheme>
    );
}

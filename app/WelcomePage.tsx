// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { type UserData } from './lib/auth/UserData';
import Typography from '@mui/material/Typography';

interface WelcomePageProps {
    user?: UserData;
}

export function WelcomePage(props: WelcomePageProps) {
    return (
        <Typography variant="h1">
            Hello, {props.user?.firstName}!
        </Typography>
    );
}

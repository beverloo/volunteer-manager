// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import EventNoteIcon from '@mui/icons-material/EventNote';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

import { type EventData } from '../lib/Event';
import { type UserData } from '../lib/auth/UserData';

interface WelcomePageProps {
    events?: EventData[];
    user?: UserData;
}

export function WelcomePage(props: WelcomePageProps) {
    const events = props.events ?? [];

    return (
        <>
            <Typography variant="h1">
                Hello, {props.user?.firstName}!
            </Typography>
            <List>
                {events.map(event =>
                    <ListItemButton key={event.slug}>
                        <ListItemIcon>
                            <EventNoteIcon />
                        </ListItemIcon>
                        <ListItemText primary={event.name}
                                      secondary={event.slug} />
                    </ListItemButton> )}
            </List>
        </>
    );
}

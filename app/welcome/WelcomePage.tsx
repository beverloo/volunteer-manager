// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { SxProps, Theme } from '@mui/system';
import EventNoteIcon from '@mui/icons-material/EventNote';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { type EventData } from '../lib/Event';
import { type UserData } from '../lib/auth/UserData';

/**
 * Manual styles that apply to the <WelcomePage> client component.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    header: {
        backgroundColor: 'primary.dark',
        color: theme => theme.palette.getContrastText(theme.palette.primary.dark),
        display: 'flex',

        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,

        margin: 0,
        paddingX: 2,
        paddingY: 1,
    },
    text: {
        flex: 1,
        paddingRight: 2,
    },
};

/**
 * Properties accepted by the <WelcomePage> client component.
 */
export interface WelcomePageProps {
    /**
     * The events (zero or more) the current visitor has access to.
     */
    events: EventData[];

    /**
     * The User the current visitor is signed in as, if any.
     */
    user?: UserData;

    /**
     * Title of the page that should be displayed at the top. Dependent on the environment.
     */
    title: string;
}

/**
 * The welcome page is the domain's root page, which routes the user to applicable applications. For
 * most visitors (who are not signed in) this includes registration for the latest event and the
 * ability to sign-in to access the portal, whereas more senior volunteers should also see buttons
 * towards the Admin and Statistics apps.
 */
export function WelcomePage(props: WelcomePageProps) {
    const events = props.events ?? [];

    return (
        <>
            <Stack direction="row" justifyContent="space-between" sx={kStyles.header}>
                <Typography sx={kStyles.text} variant="h5" component="h1" noWrap>
                    AnimeCon {props.title}
                </Typography>

                { /* TODO: Sign-in button */ }

            </Stack>

            { /* TODO: participation status */ }
            { /* TODO: landing */ }
            { /* TODO: event list */ }

            <Typography variant="h1">
                Hello, {props.user?.firstName}!
            </Typography>
            <List>
                {events.map(event =>
                    <ListItemButton key={event.slug}>
                        <ListItemIcon>
                            <EventNoteIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={event.name}
                                      secondary={event.slug} />
                    </ListItemButton> )}
            </List>
        </>
    );
}

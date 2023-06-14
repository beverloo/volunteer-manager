// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { Fragment, useState } from 'react';

import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import GroupIcon from '@mui/icons-material/Group';
import GroupsIcon from '@mui/icons-material/Groups';
import HomeIcon from '@mui/icons-material/Home';
import InsightsIcon from '@mui/icons-material/Insights';
import LabelIcon from '@mui/icons-material/Label';
import List from '@mui/material/List';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import SmsIcon from '@mui/icons-material/Sms';
import Stack from '@mui/material/Stack';

import { type Privileges } from '../lib/auth/Privileges';

/**
 *
 */
interface AdminSidebarProps {
    privileges: Privileges;
}

/**
 *
 */
export function AdminSidebar(props: AdminSidebarProps) {
    const events = [ '2023', '2022 Classic', '2022' ];

    const [ activeEvent, setActiveEvent ] = useState<number>(/* defaultEvent= */ 0);
    function toggleActiveEvent(index: number): void {
        setActiveEvent(activeEvent === index ? -1
                                             : index);
    }

    return (
        <Stack spacing={2}>
            <Box>
                Logo (TODO)
            </Box>
            <Box>
                User (TODO)
            </Box>
            <List component="nav">
                <ListItemButton divider>
                    <ListItemIcon>
                        <HomeIcon />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" />
                </ListItemButton>
                <ListItemButton>
                    <ListItemIcon>
                        <ListAltIcon />
                    </ListItemIcon>
                    <ListItemText primary="Events" />
                </ListItemButton>
                <ListItemButton divider>
                    <ListItemIcon>
                        <GroupsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Users" />
                </ListItemButton>
                { events.map((name, index) => {
                    const toggleEventVisibility =
                        () => toggleActiveEvent(index);

                    return (
                        <Fragment key={index}>
                            <ListItemButton onClick={toggleEventVisibility}>
                                <ListItemIcon>
                                    <LabelIcon />
                                </ListItemIcon>
                                <ListItemText primary={name} />
                                { activeEvent === index ? <ExpandLess /> : <ExpandMore /> }
                            </ListItemButton>
                            <Collapse in={activeEvent === index}>
                                <List disablePadding>
                                    <ListItemButton sx={{ pl: 4 }}>
                                        <ListItemIcon>
                                            <SmsIcon />
                                        </ListItemIcon>
                                        <ListItemText primary="Communication" />
                                    </ListItemButton>
                                    <ListItemButton sx={{ pl: 4 }}>
                                        <ListItemIcon>
                                            <EventNoteIcon />
                                        </ListItemIcon>
                                        <ListItemText primary="Schedule" />
                                    </ListItemButton>
                                    <ListItemButton sx={{ pl: 4 }}>
                                        <ListItemIcon>
                                            <InsightsIcon />
                                        </ListItemIcon>
                                        <ListItemText primary="Statistics" />
                                    </ListItemButton>
                                    <ListItemButton sx={{ pl: 4 }}>
                                        <ListItemIcon>
                                            <GroupIcon />
                                        </ListItemIcon>
                                        <ListItemText primary="Volunteers" />
                                    </ListItemButton>
                                </List>
                            </Collapse>
                        </Fragment> ) }) }
            </List>
        </Stack>
    );
}

// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useState } from 'react';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Badge from '@mui/material/Badge';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import EventNoteIcon from '@mui/icons-material/EventNote';
import GroupIcon from '@mui/icons-material/Group';
import HomeIcon from '@mui/icons-material/Home';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';

// TODO:
function navigateToOption(...args: any[]) {}

// TODO:
type NavigationProps = any;

/**
 * This component powers the main navigation capability of the volunteer portal, with a user
 * interface optimized for display on mobile devices. A bottom bar navigation will be displayed, in
 * which the active item will be highlighted. Administrators get an additional option.
 *
 * https://mui.com/components/bottom-navigation/
 */
export function MobileNavigation(props: NavigationProps) {
    props = {
        active: undefined,
        badgeActiveShifts: 1,
        badgeActiveEvents: 1,
        badgeActiveVolunteers: 1,
        event: {
            areas: () => [] as any[],
            identifier: '2024',
        },
        showAdministration: false,
        volunteer: undefined,
    };

    const { event, volunteer } = props;

    if (props.showAdministration)
        console.warn('The administration button is not supported in mobile navigation.');

    // Compose the activity icons part of the bottom navigation bar. Detail is deliberately lost
    // as the numeric dots take up too much space within the menu.
    const eventsIcon =
        props.badgeActiveEvents ? <Badge color="error" variant="dot"><EventNoteIcon /></Badge>
                                : <EventNoteIcon />;

    const shiftsIcon =
        props.badgeActiveShifts ? <Badge color="error" variant="dot"><AccessTimeIcon /></Badge>
                                : <AccessTimeIcon />;

    const volunteersIcon =
        props.badgeActiveVolunteers ? <Badge color="error" variant="dot"><GroupIcon /></Badge>
                                    : <GroupIcon />;

    // Anchor elements are used to display the menu through which individual areas in the location
    // can be selected, rather than having a full page for click-through.
    const [ anchorElement, setAnchorElement ] = useState<Element | null>(null);

    // Array with all of the areas that are part of the location.
    const areas = [ ...event.areas() ];

    // Handles navigation to one of the top-level bottom navigation options.
    function handleNavigation(e: React.SyntheticEvent<Element, Event>, value: string) {
        switch (value) {
            case 'events':
                setAnchorElement(e.currentTarget);
                break;
            default:
                navigateToOption(event.identifier, value);
                break;
        }
    }

    // Handles navigation to a particular area, through the area specialization.
    function handleAreaNavigation(areaIdentifier?: string) {
        setAnchorElement(/* value= */ null);
        navigateToOption(event.identifier, 'events', areaIdentifier);
    }

    return (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 2 }} elevation={3}>
            <BottomNavigation onChange={handleNavigation} value={props.active}>
                <BottomNavigationAction label="Overview"
                                        value="overview"
                                        icon={ <HomeIcon /> } />
                { props.volunteer &&
                    <BottomNavigationAction label="Shifts"
                                            value="shifts"
                                            icon={shiftsIcon} /> }
                <BottomNavigationAction label="Events"
                                        value="events"
                                        icon={eventsIcon} />
                <BottomNavigationAction label="Volunteers"
                                        value="volunteers"
                                        icon={volunteersIcon} />
            </BottomNavigation>
            <Menu anchorEl={anchorElement}
                  anchorOrigin={{ vertical: 'center', horizontal: 'center' }}
                  transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                  MenuListProps={{ sx: { minWidth: '35vw' } }}
                  onClose={e => setAnchorElement(/* value= */ null)}
                  open={!!anchorElement}>

                { areas.map((area, index) =>
                    <MenuItem key={index} divider={index === areas.length - 1}
                              onClick={e => handleAreaNavigation(area.identifier)}
                              sx={{ justifyContent: 'center' }}>
                        {area.name}
                    </MenuItem>) }

                <MenuItem onClick={e => handleAreaNavigation(/* area= */ undefined)}
                          sx={{ justifyContent: 'center' }}>Active events</MenuItem>

            </Menu>
        </Paper>
    );
}

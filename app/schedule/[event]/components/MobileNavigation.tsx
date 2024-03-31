// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useContext, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

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

import { ScheduleContext } from '../ScheduleContext';

// TODO:
function navigateToOption(...args: any[]) {}

// TODO:
type NavigationProps = any;

/**
 * This component powers the main navigation capability of the volunteer portal, with a user
 * interface optimized for display on mobile devices. A bottom bar navigation will be displayed, in
 * which the active item will be highlighted.
 *
 * https://mui.com/components/bottom-navigation/
 */
export function MobileNavigation(props: NavigationProps) {
    props = {
        active: undefined,
        badgeActiveShifts: 1,
        badgeActiveVolunteers: 1,
        volunteer: undefined,
    };

    const { event } = props;

    // ---------------------------------------------------------------------------------------------

    const router = useRouter();
    const schedule = useContext(ScheduleContext);
    const scheduleBaseUrl = useMemo(() => `/schedule/${schedule?.slug}`, [ schedule?.slug ]);

    const [ activeEvents, areas ] = useMemo(() => {
        let activeEvents: number = 0;

        const areas: { id: string; name: string; }[] = [];
        if (!!schedule) {
            for (const area of Object.values(schedule.program.areas)) {
                activeEvents += area.active;
                areas.push({
                    id: area.id,
                    name: area.name,
                });
            }

            areas.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));
        }
        return [ activeEvents, areas ];

    }, [ schedule ]);


    // Compose the activity icons part of the bottom navigation bar. Detail is deliberately lost
    // as the numeric dots take up too much space within the menu.
    const eventsIcon =
        !!activeEvents ? <Badge color="error" variant="dot"><EventNoteIcon /></Badge>
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

    // Navigates to the given `areaId`. When the `areaId` is not given, the user will be navigated
    // to the area overview page instead, which lists all the areas that exist.
    const handleAreaNavigation = useCallback((areaId?: string) => {
        if (!!areaId)
            router.push(`${scheduleBaseUrl}/areas/${areaId}`);
        else
            router.push(`${scheduleBaseUrl}/areas`);

    }, [ router, scheduleBaseUrl ]);

    return (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 2 }} elevation={3}>
            <BottomNavigation onChange={handleNavigation} value={props.active}>
                <BottomNavigationAction icon={ <HomeIcon /> } label="Overview"
                                        value="overview" />
                { props.volunteer &&
                    <BottomNavigationAction icon={shiftsIcon} label="Shifts"
                                            value="shifts" /> }
                <BottomNavigationAction icon={eventsIcon} label="Events"
                                        value="events" />
                <BottomNavigationAction icon={volunteersIcon} label="Volunteers"
                                        value="volunteers" />
            </BottomNavigation>
            <Menu anchorEl={anchorElement}
                  anchorOrigin={{ vertical: 'center', horizontal: 'center' }}
                  transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                  MenuListProps={{ sx: { minWidth: '35vw' } }}
                  onClose={e => setAnchorElement(/* value= */ null)}
                  open={!!anchorElement}>

                { areas.map((area, index) =>
                    <MenuItem key={index} divider={index === areas.length - 1}
                              onClick={ () => handleAreaNavigation(area.id) }
                              sx={{ justifyContent: 'center' }}>
                        {area.name}
                    </MenuItem>) }

                <MenuItem onClick={ () => handleAreaNavigation(/* areaId= */ undefined) }
                          sx={{ justifyContent: 'center' }}>Active events</MenuItem>

            </Menu>
        </Paper>
    );
}

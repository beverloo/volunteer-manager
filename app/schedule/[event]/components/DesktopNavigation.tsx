// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useContext, useMemo } from 'react';

import type { SystemStyleObject, Theme } from '@mui/system';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Box from '@mui/material/Box';
import EventNoteIcon from '@mui/icons-material/EventNote';
import GroupIcon from '@mui/icons-material/Group';
import HomeIcon from '@mui/icons-material/Home';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import SettingsIcon from '@mui/icons-material/Settings';
import { darken, lighten, styled } from '@mui/material/styles';

import ArrowRightIcon from '@mui/icons-material/ArrowRight';

import { kDesktopMenuWidthPx } from '../Constants';

/**
 * Styling for the <DesktopNavigation> component, particularly to enable the logo-esque image at
 * the top of the item list based on the SVG image.
 */
const kStyles: Record<string, SystemStyleObject<Theme>> = {
    container: {
        paddingX: 2,
    },

    header: {
        borderRadius: 1,
        width: `${kDesktopMenuWidthPx - 32}px`,
        height: `${kDesktopMenuWidthPx / 2}px`,
        overflow: 'hidden',
        marginTop: 2,
        marginBottom: .75,
        marginLeft: 2,
    },

    areas: {
        marginLeft: 4,
    },

    item: {
        borderRadius: theme => theme.spacing(1),
        marginBottom: 1,
    },
};

/**
 * Component for displaying a badge with textual content, generally a number.
 */
const NumberBadge = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.error.main,
    color: theme.palette.getContrastText(theme.palette.error.main),
    padding: theme.spacing(0.125, 1),
    borderRadius: theme.spacing(1),
    fontSize: theme.spacing(1.5),
    lineHeight: theme.spacing(2.25),
    pointerEvents: 'none',
}));

/**
 * Component for displaying a badge that has no content, other than an indicator.
 */
const SolidBadge = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.error.main,
    width: theme.spacing(1),
    height: theme.spacing(1),
    borderRadius: theme.spacing(.5),
    pointerEvents: 'none',
}));

/**
 * The <DesktopNavigationLogo> displays the event's logo svg with a "color" attribute towards the
 * environment's theme colour. This allows different environment to have different logos.
 */
function DesktopNavigationLogo() {
    const environment = { themeColor: '#ff4040' };

    const params = useMemo(() => {
        return new URLSearchParams([
            [ 'color', darken(environment.themeColor, .3) ],
            [ 'title', /* the empty string= */ '' ],
        ]);
    }, [ environment.themeColor ]);

    return (
        <Box sx={{ ...kStyles.header, backgroundColor: lighten(environment.themeColor, .7) }}>
            <object type="image/svg+xml" style={{ marginTop: '-35px' }}
                    data={'/images/logo.svg?' + params} />
        </Box>
    );
}

/**
 * Props accepted by the <DesktopNavigationEntry> component.
 */
interface DesktopNavigationEntryProps {
    /**
     * Whether this is the active navigation item at the moment.
     */
    active?: boolean;

    /**
     * The badge to display as part of this component. Will display a dot when set to `true`, or a
     * larger badge with a number when set to any other accepted value.
     */
    badge?: boolean | number;

    /**
     * URL that should be navigated to when the component has been clicked on.
     */
    href: string;

    /**
     * The icon that should be displayed at the start of this component, if any.
     */
    icon?: React.ReactNode;

    /**
     * The label that indicates what this menu item is meant for.
     */
    label: string;
}

/**
 * Displays a single option in the desktop navigation menu. Stateless beyond the props that it
 * accepts to change the component's display.
 */
function DesktopNavigationEntry(props: DesktopNavigationEntryProps) {
    const { active, badge, href, icon, label } = props;

    return (
        <ListItemButton selected={active}
                        sx={kStyles.item}>

            <ListItemIcon>
                {icon}
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ color: 'text.secondary' }}
                          primary={label} />

            { !!badge && badge === true && <SolidBadge /> }
            { !!badge && typeof badge === 'number' && <NumberBadge>{badge}</NumberBadge> }

        </ListItemButton>
    );
}

type NavigationProps = any;

/**
 * This component powers the main navigation capability of the volunteer portal, with a user
 * interface optimized for display on mobile devices. A list that can be shown on the left- or
 * right-hand side of the main content, to make better use of the available screen estate, without
 * polluting it with a full side-drawer.
 */
export function DesktopNavigation(props: NavigationProps) {
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

    const eventBaseUrl = `/schedule/${props.event.identifier}`;

    return (
        <>
            <DesktopNavigationLogo />
            <List sx={kStyles.container}>
                <DesktopNavigationEntry active={ props.active === 'overview' }
                                        href={ eventBaseUrl + '/' }
                                        icon={ <HomeIcon /> }
                                        label="Overview" />
                { props.volunteer &&
                    <DesktopNavigationEntry active={ props.active === 'shifts' }
                                            badge={ props.badgeActiveShifts }
                                            href={ eventBaseUrl + '/shifts/' }
                                            icon={ <AccessTimeIcon /> }
                                            label="Your shifts" /> }
                <DesktopNavigationEntry active={ props.active === 'events' }
                                        badge={ props.badgeActiveEvents }
                                        href={ eventBaseUrl + '/events/' }
                                        icon={ <EventNoteIcon /> }
                                        label="Events" />
                <List dense sx={kStyles.areas}>
                    { [ ...props.event.areas() ].map((area, index) =>
                        <DesktopNavigationEntry
                            key={index}
                            href={ eventBaseUrl + `/events/${area.identifier}/` }
                            icon={ <ArrowRightIcon /> }
                            label={ area.name } /> )}
                </List>
                <DesktopNavigationEntry active={ props.active === 'volunteers' }
                                        badge={ props.badgeActiveVolunteers }
                                        href={ eventBaseUrl + '/volunteers/' }
                                        icon={ <GroupIcon /> }
                                        label="Volunteers" />
                { props.showAdministration &&
                    <DesktopNavigationEntry active={ props.active === 'admin' }
                                            href={ eventBaseUrl + '/admin/' }
                                            icon={ <SettingsIcon /> }
                                            label="Administration" /> }
            </List>
        </>
    );
}

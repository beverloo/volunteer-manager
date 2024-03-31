// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useEffect, useRef, useState } from 'react';

import type { SystemStyleObject, Theme } from '@mui/system';
import AccountCircle from '@mui/icons-material/AccountCircle';
import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import SearchIcon from '@mui/icons-material/Search';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { alpha, styled } from '@mui/material/styles';

import { kDesktopMaximumWidthPx, kDesktopMenuWidthPx } from '../Constants';

/**
 * Containing element for the search field. Provides relative positioning, and a hover effect on
 * desktop to illustrate that interaction with this element is possible.
 * Based on https://mui.com/material-ui/react-app-bar/ (MIT)
 */
const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    marginLeft: theme.spacing(1),
    width: 'auto',
}));

/**
 * Containing element for the search icon, which should be visible both in the element's default
 * state, as well as in the expanded state where user input is accepted.
 * Based on https://mui.com/material-ui/react-app-bar/ (MIT)
 */
const SearchIconWrapper = styled('div')(({ theme }) => ({
    pointerEvents: 'none',
    position: 'absolute',

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    height: '100%',
    padding: theme.spacing(0, 2),
}));

/**
 * Input element through which the user can initiate a search. Accepts user input, and expands over
 * the width of the parent <AppBar> when input is actually being accepted.
 * Based on https://mui.com/material-ui/react-app-bar/ (MIT)
 */
const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',

    '& .MuiInputBase-input': {
        borderRadius: theme.shape.borderRadius,
        boxSizing: 'border-box',
        cursor: 'pointer',
        padding: theme.spacing(2, 0),
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create('width'),
        width: theme.spacing(6),

        '&:focus, &[value]:not([value=""])': {
            backgroundColor: alpha(theme.palette.common.white, 0.2),
            cursor: 'text',

            // There's an additional 16 spacing of emptiness in the header: 2 on either side, 2
            // between each of the three elements (4x2=8), and an additional 8 for the search box.
            width: `calc(100vw - ${theme.spacing(16)})`,
        },

        '&:focus:hover': {
            backgroundColor: alpha(theme.palette.common.white, 0.25),
        }
    },

    [theme.breakpoints.up('md')]: {
        '& .MuiInputBase-input': {
            '&:focus, &[value]:not([value=""])': {
                width: '50vw',
            },
        },
    }
}));

/**
 * Styling rules for the <ApplicationBar> component & hierarchy.
 */
const kStyles: Record<string, SystemStyleObject<Theme>> = {
    container: {
        display: 'block',
    },

    title: {
        flexGrow: 1,

        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },

    toolbar: {
        margin: 'auto',

        paddingLeft: {
            md: `${kDesktopMenuWidthPx}px`,
        },

        maxWidth: {
            md: `${kDesktopMaximumWidthPx}px`,
        },
    },
}

/**
 * Props accepted by the <ApplicationBar> component.
 */
export interface ApplicationBarProps {
    // TODO
}

/**
 * The <ApplicationBar> component is the title bar of our application. It provides the user with a
 * visual cue on where they are, allows them to search through all available information, and has
 * a menu that allows access to account settings and, potentially, other settings.
 */
export function ApplicationBar(props: ApplicationBarProps) {
    const title = 'Schedule';

    const [ searchQuery, setSearchQuery ] = useState<string>('');
    const searchBarRef = useRef<HTMLInputElement>();

    useEffect(() => {
        function interceptSearchKey(event: KeyboardEvent): void {
            if (!searchBarRef.current)
                return;

            // We support two actions: <ctrl>+<f> to start searching, and <esc> to stop searching
            // when the search bar is currently focused. The <esc> key will bubble.
            if (!!event.ctrlKey && event.keyCode === /* f= */ 70) {
                searchBarRef.current.focus();
                event.preventDefault();
            } else if (event.keyCode === /* escape= */ 27) {
                searchBarRef.current.blur();
                // let the "escape" fall through...
            }
        }

        window.addEventListener('keydown', interceptSearchKey);
        return () => window.removeEventListener('keydown', interceptSearchKey);
    });

    return (
        <>
            <AppBar position="sticky" sx={kStyles.container}>
                <Toolbar sx={kStyles.toolbar}>
                    <Typography variant="h6" component="div" sx={kStyles.title}>
                        {title}
                    </Typography>
                    <Search>
                        <SearchIconWrapper>
                            <SearchIcon />
                        </SearchIconWrapper>
                        <StyledInputBase placeholder="Search..."
                                         inputProps={{ 'aria-label': 'search' }}
                                         inputRef={searchBarRef}
                                         value={searchQuery} />
                    </Search>
                    <IconButton size="large" color="inherit">
                        <AccountCircle />
                    </IconButton>
                </Toolbar>
            </AppBar>
            { /* TODO: Search results */ }
            { /* TODO: Overflow menu */ }
        </>
    );
}

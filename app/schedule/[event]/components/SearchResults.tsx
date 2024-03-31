// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { SxProps, Theme } from '@mui/system';
import Avatar from '@mui/material/Avatar';
import ListItemIcon from '@mui/material/ListItemIcon';
import Popover from '@mui/material/Popover';
import { styled } from '@mui/material/styles';

/**
 * CSS customizations applied to the <EventListItem> component.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    container: theme => ({
        width: `calc(100vw - ${theme.spacing(16)})`,
        [theme.breakpoints.up('md')]: {
            width: '50vw',
        }
    }),
    label: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
};

/**
 * Specialization of <ListItemIcon> where the containing icon will be centered, rather than start-
 * aligned. This enables it to look consistent when shown together with avatars.
 */
const ListItemCenteredIcon = styled(ListItemIcon)(({ theme }) => ({
    paddingLeft: theme.spacing(.5),
}));

/**
 * Regular <Avatar> component except for the sizing, which has been made smaller for search results
 * to be presented in a consistently sized manner. Avatars are conventionally larger than icons.
 */
const SmallAvatar = styled(Avatar)(({ theme }) => ({
    width: theme.spacing(4),
    height: theme.spacing(4),
}));

/**
 * Props accepted by the <SearchResults> component.
 */
export interface SearchResultsProps {
    /**
     * The element to which the search results should be anchored. Can be undefined when the search
     * bar element hasn't been mounted to the DOM yet.
     */
    anchorEl?: Element;

    /**
     * Whether to commit to the first search result. The popover will be closed automatically after.
     */
    commit?: boolean;

    /**
     * Event that will be triggered when the <SearchResults> component should close.
     */
    onClose: () => void;

    /**
     * The search query for which results should be shown. The component will not display anything
     * when no query has been passed.
     */
    query?: string;
}

/**
 * The <SearchResults> component doesn't just identify the search results, but also lists the
 * results in a way that works well for the user.
 */
export function SearchResults(props: SearchResultsProps) {
    const { anchorEl, commit, onClose, query } = props;

    if (!anchorEl || !query)
        return undefined;

    // ...

    return (
        <Popover anchorEl={anchorEl}
                 anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
                 transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                 slotProps={{ paper: { sx: kStyles.container } }}
                 disableAutoFocus disableEnforceFocus
                 elevation={4} open={true}
                 onClose={onClose}>

            TODO

        </Popover>
    );
}

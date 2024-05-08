// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import VisibilityIcon from '@mui/icons-material/Visibility';

/**
 * CSS customizations applied to the <ListItemEventText> component.
 */
const kListItemEventTextStyles: SxProps<Theme> = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

/**
 * Props accepted by the <ListItemEventText> component.
 */
export interface ListItemEventTextProps {
    /**
     * Whether the event is hidden from visitors.
     */
    invisible?: boolean;

    /**
     * Title that the event should be announced with.
     */
    title: React.ReactNode;
}

/**
 * The <ListItemEventText> component displays the text regarding an event entry, optionally visually
 * annotated to indicate that the event is hidden from the public.
 */
export function ListItemEventText(props: ListItemEventTextProps) {
    if (!!props.invisible) {
        return (
            <ListItemText primaryTypographyProps={{ sx: kListItemEventTextStyles }}
                          primary={
                              <>
                                  <em>{props.title}</em>
                                  <Tooltip title="Hidden from visitors">
                                      <VisibilityIcon fontSize="inherit" color="info"
                                                      sx={{ marginLeft: 1,
                                                            verticalAlign: 'middle' }} />
                                  </Tooltip>
                              </>
                          } />
        );
    }

    return (
        <ListItemText primaryTypographyProps={{ sx: kListItemEventTextStyles }}
                      primary={props.title} />
    );
}

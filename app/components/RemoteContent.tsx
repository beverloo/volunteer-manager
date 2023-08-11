// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useEffect, useState } from 'react';

import type { SxProps, Theme } from '@mui/system';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { alpha, darken, lighten } from '@mui/system';

import type { EventData } from '@app/lib/Event';
import type { HotelsDefinition } from '@app/api/event/hotels';
import { Markdown } from './Markdown';
import { issueServerAction } from '@app/lib/issueServerAction';

/**
 * Mechanism for formatting hotel room prices in euros. Prefer Intl.NumberFormat, but fall back to
 * good 'ol `Number.prototype.toFixed` for older browsers.
 */
const kPriceFormatter =
    (typeof window !== 'undefined' && typeof window.Intl !== 'undefined')
        ? new Intl.NumberFormat('en-NL', { style: 'currency', currency: 'EUR' })
        : { format: (value: number) => `€${value.toFixed(2)}` };

/**
 * Manual styles that apply to the <RemoteContent> client components.
 */
const kStyles: { [key: string]: SxProps<Theme> } = {
    hotelTable: {
        width: 'fit-content',
        marginY: 2,

        borderRadius: 1,
        border: theme => `1px solid ${
            theme.palette.mode === 'light' ? lighten(alpha(theme.palette.divider, 1), 0.88)
                                           : darken(alpha(theme.palette.divider, 1), 0.68) }`,

        '& > .MuiTable-root': {
            width: 'auto',
        },

        '& .MuiTableBody-root > .MuiTableRow-root:last-of-type > .MuiTableCell-root': {
            borderBottomWidth: 0,
        }
    },
};

/**
 * Props accepted by the <RemoteContent> component.
 */
export interface RemoteContentProps {
    /**
     * Event for which the remote content is being rendered.
     */
    event?: EventData;

    /**
     * Type of remote content that should be included.
     */
    type: 'hotels';
}

/**
 * Displays information about the hotel rooms that are available for a particular event. The content
 * will be displayed as if it were common page content.
 */
function RemoteContentHotels(props: Omit<RemoteContentProps, 'hotels'>) {
    const [ hotels, setHotels ] = useState<HotelsDefinition['response']>();
    useEffect(() => {
        if (!props.event)
            return;

        issueServerAction<HotelsDefinition>('/api/event/hotels', {
            event: props.event.slug
        }).then(response => setHotels(response));

    }, [ props.event ]);

    if (!hotels) {
        return (
            <>
                <Skeleton animation="wave" height={16} width="40%" />
                <Skeleton animation="wave" height={16} width="60%" />
                <Skeleton animation="wave" height={16} width="50%" />
                <Skeleton animation="wave" height={16} width="60%" />
            </>
        );
    }

    if (!hotels.hotels.length) {
        const event = props.event?.name ?? 'this AnimeCon event';
        const message = `> Hotel room availability for ${event} has not been published yet.`;

        return <Markdown>{message}</Markdown>;
    }

    return (
        <>
            { hotels.hotels.map(hotel =>
                <>
                    <Typography variant="h6">
                        {hotel.name}
                    </Typography>
                    <Markdown>
                        {hotel.description}
                    </Markdown>
                    <TableContainer sx={kStyles.hotelTable}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Room type</TableCell>
                                    <TableCell>Price</TableCell>
                                    <TableCell>Price per person</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                { hotel.rooms.map(room =>
                                    <TableRow key={room.id}>
                                        <TableCell>{room.name}</TableCell>
                                        <TableCell>
                                            {kPriceFormatter.format(room.price / 100)}/night
                                        </TableCell>
                                        <TableCell>
                                            {kPriceFormatter.format(room.price / room.people / 100)}
                                            /person/night
                                        </TableCell>
                                    </TableRow> ) }
                            </TableBody>
                        </Table>
                    </TableContainer>
                </> ) }
        </>
    );
}

/**
 * Provides remote content that can be included in Markdown content. Useful tool for de-duplicating
 * informationw here it has to be available in multiple places, such as hotel information.
 */
export function RemoteContent(props: RemoteContentProps) {
    switch (props.type) {
        case 'hotels':
            return RemoteContentHotels(props);
    }

    return undefined;
}
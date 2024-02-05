// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';

import { default as MuiLink } from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Table from '@mui/material/Table';

import { Temporal, formatDate } from '@lib/Temporal';

/**
 * Props accepted by the <ExportMetadata> component.
 */
export interface ExportMetadataProps {
    /**
     * Metadata of the export that is expected to be available by this component.
     */
    metadata: {
        date: string,
        slug: string;
        type: string;
        eventName: string;
        expirationDate: string;
        expirationViews: number;
        justification: string;
        userId: number;
        userName: string;
        views: number;
    };
}

/**
 * The <ExportMetadata> component displays a table displaying the metadata of a given export. The
 * data is fairly rich and interactive.
 */
export function ExportMetadata(props: ExportMetadataProps) {
    const { metadata } = props;

    const [ copied, setCopied ] = useState<boolean>(false);

    const origin = globalThis.document ? globalThis.document.location.origin : '';
    const href = `${origin}/exports/${metadata.slug}`;

    const handleCopyLink = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        navigator.clipboard.writeText(href);
        setCopied(true);
    }, [ href ]);

    const localTz = Temporal.Now.timeZoneId();

    return (
        <>
            <Collapse in={!!copied}>
                <Alert severity="success" sx={{ mt: 1, mb: 1 }}>
                    The link has been copied to your clipboard.
                </Alert>
            </Collapse>
            <Table size="small">
                <TableRow>
                    <TableCell variant="head" width="25%">
                        Shareable link
                    </TableCell>
                    <TableCell>
                        <MuiLink component={Link} href={'#'} onClick={handleCopyLink}>
                            {href} <ContentCopyIcon sx={{ ml: .5 }} fontSize="inherit" />
                        </MuiLink>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell variant="head">
                        Expiration date
                    </TableCell>
                    <TableCell>
                        { formatDate(
                            Temporal.ZonedDateTime.from(
                                metadata.expirationDate).withTimeZone(localTz),
                            'MMMM D, YYYY [at] HH:mm:ss') }
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell variant="head">
                        Expiration views
                    </TableCell>
                    <TableCell>
                        {metadata.expirationViews} (seen: {metadata.views})
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell variant="head">
                        Exported by
                    </TableCell>
                    <TableCell>
                        <MuiLink component={Link} href={`/admin/volunteers/${metadata.userId}`}>
                            {metadata.userName}
                        </MuiLink> on{' '}
                        { formatDate(
                            Temporal.ZonedDateTime.from(metadata.date).withTimeZone(localTz),
                            'MMMM D, YYYY [at] HH:mm:ss') }
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell variant="head">
                        Exported data
                    </TableCell>
                    <TableCell>
                        {metadata.eventName} {metadata.type}
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell variant="head">
                        Justification
                    </TableCell>
                    <TableCell>
                        {metadata.justification}
                    </TableCell>
                </TableRow>
            </Table>
        </>
    );
}

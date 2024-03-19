// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';

import { default as MuiLink } from '@mui/material/Link';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import PaletteIcon from '@mui/icons-material/Palette';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type { EventShiftContext, EventShiftRowModel } from '@app/api/admin/event/shifts/[[...id]]/route';
import { ExcitementIcon } from '@app/admin/components/ExcitementIcon';
import { RemoteDataTable, type RemoteDataTableColumn } from '@app/admin/components/RemoteDataTable';
import { Square } from '@app/admin/components/Square';

/**
 * Formats the given number of `minutes` to a HH:MM string.
 */
function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes - hours * 60;

    return remainingMinutes ? `${hours}:${('00' + remainingMinutes).substr(-2)}`
                            : `${hours}`;
}

/**
 * Props accepted by the <ShiftTable> component.
 */
export type ShiftTableProps = EventShiftContext['context'] & {
    /**
     * Whether the shift table should be shown in read only mode.
     */
    readOnly?: boolean;
};

/**
 * The <ShiftTable> component is a Data Table that allows rows to be shown and deleted, which
 * displays the shifts that exist for a particular { event, team } pair.
 */
export function ShiftTable(props: ShiftTableProps) {
    const { readOnly, ...context } = props;

    const deleteColumn: RemoteDataTableColumn<EventShiftRowModel>[] = [];
    if (!readOnly) {
        deleteColumn.push({
            field: 'id',
            headerName: /* no header= */ '',
            sortable: false,
            width: 50,
        });
    }

    const columns: RemoteDataTableColumn<EventShiftRowModel>[] = [
        ...deleteColumn,
        {
            field: 'colour',
            headerAlign: 'center',
            headerName: /* no header= */ '',
            sortable: false,
            align: 'center',
            width: 50,

            renderHeader: params =>
                <Tooltip title="Colour assigned to this shift">
                    <PaletteIcon fontSize="small" color="primary" />
                </Tooltip>,

            renderCell: params =>
                <Square colour={params.value} title="Colour assigned to this shift" />,
        },
        {
            field: 'category',
            headerName: 'Category',
            sortable: true,
            width: 200,
        },
        {
            field: 'name',
            headerName: 'Shift',
            sortable: true,
            flex: 3,

            renderCell: params =>
                <MuiLink component={Link} href={`./shifts/${params.row.id}`}>
                    {params.value}
                </MuiLink>,
        },
        {
            field: 'demandInMinutes',
            headerName: 'Demand',
            sortable: true,
            flex: 2,

            renderCell: params => {
                if (!params.value) {
                    return (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                            …
                        </Typography>
                    );
                }

                return <>{formatMinutes(params.value)} hours</>;
            },
        },
        {
            field: 'scheduledInMinutes',
            headerName: 'Scheduled',
            sortable: true,
            flex: 2,

            renderCell: params => {
                if (!params.value) {
                    return (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                            …
                        </Typography>
                    );
                }

                return <>{formatMinutes(params.value)} hours</>;
            },
        },
        {
            field: 'activityId',
            headerAlign: 'center',
            headerName: /* empty= */ '',
            sortable: false,
            align: 'center',
            width: 50,

            renderHeader: () =>
                <Tooltip title="Initiative or program?">
                    <NewReleasesIcon fontSize="small" color="primary" />
                </Tooltip>,

            renderCell: params => {
                if (!params.value) {
                    return (
                        <Tooltip title="(our initiative)">
                            <NewReleasesIcon fontSize="small" color="disabled" />
                        </Tooltip>
                    );
                }

                const href = `../program/activities/${params.row.activityId}`;
                return (
                    <Tooltip title={params.row.activityName}>
                        <MuiLink component={Link} href={href} sx={{ pt: '5px' }}>
                            <NewReleasesIcon fontSize="small" color="success" />
                        </MuiLink>
                    </Tooltip>
                );
            }
        },
        {
            field: 'description',
            headerAlign: 'center',
            headerName: /* empty= */ '',
            sortable: false,
            align: 'center',
            width: 50,

            renderHeader: () =>
                <Tooltip title="Shift description written?">
                    <DescriptionOutlinedIcon fontSize="small" color="primary" />
                </Tooltip>,

            renderCell: params => {
                if (!!params.value && !!params.value.length) {
                    return (
                        <Tooltip title="Description has been written">
                            <DescriptionOutlinedIcon fontSize="small" color="success" />
                        </Tooltip>
                    );
                } else {
                    return (
                        <Tooltip title="Description is missing">
                            <DescriptionOutlinedIcon fontSize="small" color="warning" />
                        </Tooltip>
                    );
                }
            },
        },
        {
            field: 'excitement',
            headerAlign: 'center',
            headerName: /* empty= */ '',
            sortable: false,
            align: 'center',
            width: 50,

            renderHeader: () =>
                <Tooltip title="Volunteer sentiment">
                    <SentimentSatisfiedAltIcon fontSize="small" color="primary" />
                </Tooltip>,

            renderCell: params =>
                <ExcitementIcon excitement={params.value} />,
        }
    ];

    return (
        <RemoteDataTable columns={columns} endpoint="/api/admin/event/shifts" context={context}
                         defaultSort={{ field: 'categoryOrder', sort: 'asc' }} subject="shift"
                         enableDelete={!readOnly} pageSize={100} disableFooter />
    );
}

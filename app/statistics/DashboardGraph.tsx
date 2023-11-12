// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { BarSeriesType, LineSeriesType } from '@mui/x-charts';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';

/**
 * Props accepted by the <DashboardGraph> component, regardless of presentation.
 */
interface DashboardGraphBaseProps {
    /**
     * Optional conclusion to display on top of the chart.
     */
    conclusion?: string;

    /**
     * Whether the graph should be full width, otherwise we might stack them aside.
     */
    fullWidth?: boolean;

    /**
     * Optional title to display at the top of the chart. May be omitted.
     */
    title?: string;
}

/**
 * Data type describing the data to be passed to the area chart.
 */
export type DashboardAreaGraphSeries = LineSeriesType[];

/**
 * Props accepted by the <DashboardGraph> component when displaying an area chart.
 */
interface DashboardAreaGraphProps {
    /**
     * Presentation type of the graph.
     */
    presentation: 'area';

    /**
     * The data that should be displayed on the dashboard.
     */
    data: DashboardAreaGraphSeries;

    /**
     * Labels that should be shown on the area graph.
     */
    labels: string[];
}

/**
 * Component that will render behaviour specific to area charts.
 */
function DashboardAreaGraph(props: DashboardAreaGraphProps) {
    return (
        <LineChart series={props.data} xAxis={ [{ data: props.labels, scaleType: 'point' }] } />
    );
}

/**
 * Data type describing the data to be passed to the bar chart.
 */
export type DashboardBarGraphSeries = BarSeriesType[];

/**
 * Props accepted by the <DashboardGraph> component when displaying a bar chart.
 */
interface DashboardBarGraphProps {
    /**
     * Presentation type of the graph.
     */
    presentation: 'bar';

    /**
     * The data that should be displayed on the dashboard.
     */
    data: DashboardBarGraphSeries;

    /**
     * Labels that should be shown on the bar graph.
     */
    labels: string[];
}

/**
 * Component that will render behaviour specific to bar charts.
 */
function DashboardBarGraph(props: DashboardBarGraphProps) {
    return (
        <BarChart series={props.data} xAxis={ [{ data: props.labels, scaleType: 'band' }] } />
    );
}

/**
 * Props accepted by the <DashboardGraph> component when displaying a pie chart.
 */
interface DashboardPieGraphProps {
    /**
     * Presentation type of the graph.
     */
    presentation: 'pie';

    /**
     * Data to be presented on the pie graph.
     */
    data: { id: number; value: number; label: string; }[];
}

/**
 * Component that will render behaviour specific to pie charts.
 */
function DashboardPieGraph(props: DashboardPieGraphProps) {
    return (
        <PieChart series={[ { data: props.data }] } />
    );
}

/**
 * The <DashboardGraphContainer> component is the base container for graph content. It is shared
 * between the <DashboardGraph> and the <DashboardGraphFallback> components.
 */
function DashboardGraphContainer(props: React.PropsWithChildren<DashboardGraphBaseProps>) {
    const { children, conclusion, fullWidth, title } = props;

    return (
        <Grid xs={12} md={fullWidth ? 12 : 6} sx={{ aspectRatio: 2 }}>
            { (!!title || !!conclusion) &&
                <Box sx={{ pb: 1 }}>
                    { !!title &&
                        <Typography textAlign="center" variant="h6">
                            {title}
                        </Typography> }
                    { !!conclusion &&
                        <Typography component="p" textAlign="center" variant="caption">
                            ( <em>{conclusion}</em> )
                        </Typography> }
                </Box> }
            { children }
        </Grid>
    );
}

/**
 * Props accepted by the <DashboardGraph> component, specific to presentation.
 */
export type DashboardGraphProps = React.PropsWithChildren<DashboardGraphBaseProps> &
    (DashboardAreaGraphProps | DashboardBarGraphProps | DashboardPieGraphProps);

/**
 * Individual graph container that should be displayed on the dashboard. Should have a single child
 * that is the graph to display, which depends on the sort of data to include.
 */
export function DashboardGraph(props: DashboardGraphProps) {
    return (
        <DashboardGraphContainer conclusion={props.conclusion} fullWidth={props.fullWidth}
                                 title={props.title}>
            { props.presentation === 'area' && <DashboardAreaGraph {...props} /> }
            { props.presentation === 'bar' && <DashboardBarGraph {...props} /> }
            { props.presentation === 'pie' && <DashboardPieGraph {...props} /> }
            { props.children }
        </DashboardGraphContainer>
    );
}

/**
 * Fallback container to display when the graph content is still being loaded from the database.
 */
export function DashboardGraphFallback(props: DashboardGraphBaseProps) {
    return (
        <DashboardGraphContainer fullWidth={props.fullWidth} title={props.title}
                                 conclusion="loading…">
            <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                <CircularProgress color="primary" />
            </Stack>
        </DashboardGraphContainer>
    );
}

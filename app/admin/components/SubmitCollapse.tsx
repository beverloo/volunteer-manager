// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Box, { type BoxProps } from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import LoadingButton from '@mui/lab/LoadingButton';
import Typography from '@mui/material/Typography';
import { red } from '@mui/material/colors';
import { styled } from '@mui/material/styles';

/**
 * Props accepted by the <SubmitCollapse> component.
 */
export interface SubmitCollapseProps extends BoxProps {
    /**
     * Error message that should be displayed in case anything went wrong.
     */
    error?: string;

    /**
     * Whether the submit button should be in a loadable state.
     */
    loading?: boolean;

    /**
     * Whether the collapsable submit button should be opened.
     */
    open?: boolean;
}

/**
 * The <SubmitCollapse> component represents a collapsable submit button that should only be shown
 * when changes have been made to the form. The component can further represent loading and error
 * states as well.
 */
export const SubmitCollapse = styled((props: SubmitCollapseProps) => {
    const { error, loading, open, ...boxProps } = props;

    return (
        <Collapse in={!!open}>
            <Box {...boxProps}>
                <LoadingButton loading={!!loading} variant="contained" type="submit">
                    Save changes
                </LoadingButton>
                { error &&
                    <Typography sx={{ display: 'inline-block', ml: 2 }}>
                        {error}
                    </Typography> }
            </Box>
        </Collapse>
    );
})(({ theme }) => ({
    ['&']: {
        backgroundColor: theme.palette.mode === 'light' ? red[50] : red[900],
        borderRadius: theme.shape.borderRadius,
        padding: theme.spacing(1),
    },
}));

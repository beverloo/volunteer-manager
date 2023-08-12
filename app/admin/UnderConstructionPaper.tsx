// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Paper from '@mui/material/Paper';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import Typography from '@mui/material/Typography';

/**
 * A MUI <Paper> with basic content to show that the current page is still under construction. The
 * children of this component will be rendered as the page header.
 */
export function UnderConstructionPaper(props: React.PropsWithChildren) {
    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5">
                {props.children}
                <PendingActionsRoundedIcon color="error" fontSize="small"
                                           sx={{ ml: 0.8, verticalAlign: 'middle' }} />
            </Typography>
            <Typography variant="body2">
                This page is not available yet. You should nag Peter in case there is something
                you really need, as the necessary data most likely exists somewhere.
            </Typography>
        </Paper>
    );
}

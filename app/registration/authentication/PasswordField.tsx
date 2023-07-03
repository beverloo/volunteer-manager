// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { type TextFieldElementProps, TextFieldElement } from 'react-hook-form-mui';

import Box from '@mui/material/Box';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

/**
 * Props accepted by the <PasswordField> component.
 */
export interface PasswordFieldProps extends TextFieldElementProps {
    /**
     * Whether the numbers in the password need to add up to a certain sum. This isn't a real
     * requirement and will by bypassed by the validation function after being shown once.
     */
    requireNumberSum?: boolean;
}

/**
 * The <PasswordField> component asks the user to enter their (new) password. It validates the
 * password automatically while the user it typing, while continuing to make the result available to
 * the react-hook-for-mui parent.
 */
export function PasswordField({ requireNumberSum, ...props }: PasswordFieldProps) {
    const failedLengthRequirement = false;
    const failedNumberRequirement = false;
    const failedNumberSumRequirement = true;
    const failedCaseRequirements = false;

    // TODO: Automatically update the state (now stored as constants) whenever the password changes.

    const failedAnyRequirement =
        failedLengthRequirement || failedNumberRequirement || failedCaseRequirements ||
        (failedNumberSumRequirement && requireNumberSum);

    return (
        <Box>
            <TextFieldElement {...props} />
            <Collapse in={failedAnyRequirement}>
                <List dense disablePadding sx={{ pt: 1 }}>
                    { failedLengthRequirement &&
                        <ListItem disablePadding>
                            <ListItemIcon sx={{ minWidth: '32px' }}>
                                <CheckCircleIcon color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>
                                At least eight characters in length
                            </ListItemText>
                        </ListItem> }
                    { failedNumberRequirement &&
                        <ListItem disablePadding>
                            <ListItemIcon  sx={{ minWidth: '32px' }}>
                                <CheckCircleIcon color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primaryTypographyProps={{ variant: 'body2' }}>
                                Contains at least one number
                            </ListItemText>
                        </ListItem> }
                    { failedNumberSumRequirement &&
                        <ListItem disablePadding>
                            <ListItemIcon  sx={{ minWidth: '32px' }}>
                                <CancelIcon color="error" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primaryTypographyProps={{ variant: 'body2' }}>
                                Numbers in the password add up to 25
                            </ListItemText>
                        </ListItem> }
                    { failedCaseRequirements &&
                        <ListItem disablePadding>
                            <ListItemIcon  sx={{ minWidth: '32px' }}>
                                <CheckCircleIcon color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primaryTypographyProps={{ variant: 'body2' }}>
                                Contains both lowercase and uppercase characters
                            </ListItemText>
                        </ListItem> }
                </List>
            </Collapse>
        </Box>
    );
}

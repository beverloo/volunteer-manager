// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Alert, { type AlertProps, alertClasses } from '@mui/material/Alert';
import { styled } from '@mui/material/styles';

/**
 * Props accepted by the <TransitionAlert> component.
 */
export type TransitionAlertProps = AlertProps;

/**
 * The <TransitionAlert> component is a regular <Alert> except that changes in severity will cause
 * the background to transition in colour.
 */
export const TransitionAlert = styled((props: React.PropsWithChildren<TransitionAlertProps>) =>
    <Alert {...props} />
)(({ theme }) => ({
    [`&.${alertClasses.root}`]: {
        transition: theme.transitions.create('background-color'),
    },
}));

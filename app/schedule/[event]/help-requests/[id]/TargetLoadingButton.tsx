// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Button, { type ButtonProps } from '@mui/material/Button';

import type { DisplayHelpRequestTarget } from '@lib/database/Types';

import { kHelpRequestColours } from '@app/admin/organisation/displays/HelpRequestColours';

/**
 * Props accepted by the <TargetLoadingButton> component.
 */
interface TargetLoadingButtonProps extends Omit<ButtonProps, 'sx'> {
    /**
     * Target of the help request. Used to determine the button's colour.
     */
    target: DisplayHelpRequestTarget;
}

/**
 * The <TargetLoadingButton> component is a regular MUI <Button>, except styled for a particular
 * help request target type.
 */
export function TargetLoadingButton(props: TargetLoadingButtonProps) {
    const { target, ...buttonProps } = props;

    const [ foreground, background ] = kHelpRequestColours[target];
    return (
        <Button {...buttonProps}
                sx={{
                    backgroundColor: background,
                    color: foreground,

                    '&:active': { backgroundColor: background, color: foreground },
                    '&:focus': { backgroundColor: background, color: foreground },
                    '&:hover': { backgroundColor: background, color: foreground },
                }} />
    );
}

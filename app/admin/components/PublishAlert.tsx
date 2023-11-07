// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useState } from 'react';

import LoadingButton from '@mui/lab/LoadingButton';
import Stack, { stackClasses } from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alertClasses } from '@mui/material/Alert';
import { styled } from '@mui/material/styles';

import { TransitionAlert, type TransitionAlertProps } from './TransitionAlert';

/**
 * Props accepted by the <PublishAlert> component.
 */
export interface PublishAlertProps
    extends Omit<TransitionAlertProps, 'elevation' | 'onClick' | 'severity'>
{
    /**
     * Callback that should be invoked when the publication state should change.
     */
    onClick?: (event: unknown, publish: boolean) => void | Promise<void>;

    /**
     * Whether the status quo is that the subject is published.
     */
    published?: boolean;
}

/**
 * The <PublishAlert> component can be used to control visibility of particular information to
 * volunteers.
 */
export const PublishAlert = styled((props: React.PropsWithChildren<PublishAlertProps>) => {
    const { children, onClick, published, ...rest } = props;

    const [ loading, setLoading ] = useState<boolean>(false);

    const handleClick = useCallback(async (event: unknown) => {
        setLoading(true);
        try {
            if (onClick)
                await onClick(event, !published);
        } finally {
            setLoading(false);
        }
    }, [ onClick, published ]);

    return (
        <TransitionAlert {...rest} severity={ !!published ? 'success' : 'error' }>
            <Stack direction="row">
                <Typography variant="body2">
                    {children}
                </Typography>
                { onClick &&
                    <LoadingButton loading={loading} size="small" sx={{ mt: '2px' }}
                                   onClick={handleClick}>
                        { !!published ? 'Unpublish' : 'Publish' }
                    </LoadingButton> }
            </Stack>
        </TransitionAlert>
    );
})(({ theme }) => ({
    [`&.${alertClasses.root}`]: {
        alignItems: 'center',
    },
    [`& .${alertClasses.message}`]: {
        flexGrow: 1,
        padding: 0,
    },
    [`& .${alertClasses.message} > .${stackClasses.root}`]: {
        alignItems: 'center',
        justifyContent: 'space-between',
    },
}));

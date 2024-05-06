// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

/**
 * Props accepted by the <ErrorCard> component.
 */
export interface ErrorCardProps {
    /**
     * Title of the error.
     */
    title?: string;
}

/**
 * The <ErrorCard> component displays a card with an error message on it. The "title" argument is
 * optional, whereas the component's children will make up the error's message.
 */
export function ErrorCard(props: React.PropsWithChildren<ErrorCardProps>) {
    return (
        <Alert elevation={1} severity="error">
            { !!props.title && <AlertTitle>{props.title}</AlertTitle> }
            { props.children }
        </Alert>
    );
}

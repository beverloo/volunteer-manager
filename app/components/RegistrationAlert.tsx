// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Alert from '@mui/material/Alert';

/**
 * Props accepted by the <RegistrationAlert> component.
 */
interface RegistrationAlertProps {
    /**
     * Severity of the alert. Defaults to "info".
     */
    severity?: 'error' | 'warning' | 'info';
}

/**
 * The <RegistrationAlert> component displays an alert on the registration pages, either directly
 * through our code or through the use of Markdown. Both will display in the same manner.
 */
export function RegistrationAlert(props: React.PropsWithChildren<RegistrationAlertProps>) {
    return (
        <Alert severity={props.severity}>
            {props.children}
        </Alert>
    );
}

// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Alert from '@mui/material/Alert';

/**
 * Props accepted by the <SectionIntroduction> component.
 */
interface SectionIntroductionProps {
    /**
     * Whether the introduction is important and should receive additional emphasis.
     */
    important?: boolean;
}

/**
 * The <SectionIntroduction> component can be used to introduce the user to the purpose of a
 * particular section. The `important` prop can be used to give the explanation additional clarity.
 */
export function SectionIntroduction(props: React.PropsWithChildren<SectionIntroductionProps>) {
    return (
        <Alert severity={ !!props.important ? 'warning' : 'info' }>
            {props.children}
        </Alert>
    );
}

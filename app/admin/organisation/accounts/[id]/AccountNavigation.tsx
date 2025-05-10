// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

/**
 * Props accepted by the <AccountNavigation> component.
 */
export interface AccountNavigationProps {
    /**
     * Pages that should be displayed as part of account navigation.
     */
    pages: {
        /**
         * Icon that should be shown on the page's tab.
         */
        icon: React.JSX.Element;

        /**
         * Label that should be shown on the page's tab.
         */
        label: string;

        /**
         * URL that should be navigated to when the page has been activated.
         */
        url: string;
    }[];
}

/**
 * The <AccountNavigation> component provides client-side navigation options designed to switch
 * between different pages of a particular user's account.
 */
export function AccountNavigation(props: AccountNavigationProps) {
    const pathname = usePathname();
    const router = useRouter();

    const [ selectedTabIndex, setSelectedTabIndex ] =
        useState<number | undefined>(/* Information= */ 0);

    useEffect(() => {
        for (let index = 0; index < props.pages.length; ++index) {
            if (pathname !== props.pages[index].url)
                continue;

            setSelectedTabIndex(index);
            break;
        }
    }, [ pathname, props.pages ]);

    const handleChange = useCallback((event: unknown, index: number) => {
        if (index < 0 || index >= props.pages.length)
            return;

        // Note that the `useEffect` above will take care of updating the tab bar.
        router.push(props.pages[index].url);

    }, [ props.pages, router ]);

    return (
        <Tabs onChange={handleChange} value={selectedTabIndex} variant="fullWidth">
            { props.pages.map(({ label, icon }, index) =>
                <Tab key={index} icon={icon} iconPosition="start" label={label} /> )}
        </Tabs>
    );
}

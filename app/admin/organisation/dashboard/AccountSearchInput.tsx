// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

/**
 * Props accepted by the <AccountSearchInput> component.
 */
interface AccountSearchInputProps {
    /**
     * Array of accounts that are searchable through this interface.
     */
    accounts: {
        /**
         * Unique ID of this account.
         */
        id: number;

        /**
         * Name of the account (either their full name, or their display name).
         */
        name: string;

        /**
         * Additional keywords through which this user should be identifyable.
         */
        keywords?: string;
    }[];
}

/**
 * The <AccountSearchInput> component displays the input field that powers account search, which
 * relies on client-side logic for its user experience. The box can be focused by the user pressing
 * the <ctrl>+<f> keyboard combination in their browser.
 */
export function AccountSearchInput(props: AccountSearchInputProps) {
    const router = useRouter();

    // ---------------------------------------------------------------------------------------------

    const searchBarRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        function interceptSearchKey(event: KeyboardEvent): void {
            if (!searchBarRef.current)
                return;

            if (!event.ctrlKey || event.keyCode !== /* f= */ 70)
                return;

            event.preventDefault();
            searchBarRef.current.focus();
        }

        window.addEventListener('keydown', interceptSearchKey);
        return () => window.removeEventListener('keydown', interceptSearchKey);
    }, [ /* no dependencies */ ]);

    // ---------------------------------------------------------------------------------------------

    const handleSelectionChange = useCallback(
        (event: unknown, value: AccountSearchInputProps['accounts'][number] | null) => {
            if (!!value && !!value.id)
                router.push(`/admin/organisation/accounts/${value.id}`);

        }, [ router ]);

    // ---------------------------------------------------------------------------------------------

    return (
        <Autocomplete sx={{ flexGrow: 1 }} options={props.accounts} autoFocus
                      onChange={handleSelectionChange}
                      getOptionLabel={ option => `${option.name} ${option.keywords}` }
                      renderOption={ (renderProps, option) => {
                          return (
                              <Box component="li" {...renderProps} key={option.id}>
                                  {option.name}
                              </Box>
                          );
                      }}
                      renderInput={ params =>
                          <TextField {...params} inputRef={searchBarRef}
                                     label="Search for an account…" size="small" fullWidth /> } />
    );
}

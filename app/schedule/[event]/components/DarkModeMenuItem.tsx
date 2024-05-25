// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useCallback, useContext } from 'react';

import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import Divider from '@mui/material/Divider';
import LightModeIcon from '@mui/icons-material/LightMode';
import MenuItem from '@mui/material/MenuItem';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';

import { ScheduleThemeContext } from '../ScheduleTheme';

/**
 * The <DarkModeMenuItem> component enables the user to switch the portal between light, dark or
 * auto mode (the default). State changes persist for the local device.
 */
export function DarkModeMenuItem() {
    const themeContext = useContext(ScheduleThemeContext);

    const setAutoMode = useCallback(() => themeContext.updateMode?.('auto'), [ themeContext ]);
    const setDarkMode = useCallback(() => themeContext.updateMode?.('dark'), [ themeContext ]);
    const setLightMode = useCallback(() => themeContext.updateMode?.('light'), [ themeContext ]);

    return (
        <>
            <MenuItem dense disableRipple disableTouchRipple>
                <ButtonGroup variant="outlined">
                    <Button variant={ themeContext.mode === 'light' ? 'contained' : 'outlined' }
                            onClick={ setLightMode }>
                        <LightModeIcon fontSize="small" />
                    </Button>
                    <Button variant={ themeContext.mode === 'auto' ? 'contained' : 'outlined' }
                            onClick={ setAutoMode }>
                        <SettingsBrightnessIcon fontSize="small" />
                    </Button>
                    <Button variant={ themeContext.mode === 'dark' ? 'contained' : 'outlined' }
                            onClick={ setDarkMode }>
                        <DarkModeIcon fontSize="small" />
                    </Button>
                </ButtonGroup>
            </MenuItem>
            <Divider />
        </>
    );
}

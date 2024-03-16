// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import device from './lib/Device';

declare module globalThis {
    let animeConBrightnessValue: number;
    let animeConInitialised: boolean;
    let animeConLockedValue: boolean;
    let animeConVolumeValue: number;
}

/**
 * Initialises the global values. This function guarantees to only execute once.
 */
export function onceInitialiseGlobals() {
    if (!!globalThis.animeConInitialised)
        return;

    globalThis.animeConInitialised = true;
    globalThis.animeConLockedValue = false;

    device.getBrightness().then(brightness => {
        globalThis.animeConBrightnessValue = brightness ?? /* default= */ 50;
    });

    device.getVolume().then(volume => {
        globalThis.animeConVolumeValue = volume ?? /* default= */ 0;
    });
}

/**
 * Returns the global brightness value.
 */
export function getBrightnessValue(): number {
    return globalThis.animeConBrightnessValue ?? /* default= */ 50;
}

/**
 * Sets the global brightness value to the given `value`.
 */
export function setBrightnessValue(value: number): void {
    globalThis.animeConBrightnessValue = value;
}

/**
 * Returns whether the device is currently locked.
 */
export function isLockedValue(): boolean {
    return globalThis.animeConLockedValue;
}

/**
 * Sets the global locked value to the given `value`.
 */
export function setLockedValue(value: boolean): void {
    globalThis.animeConLockedValue = value;
}

/**
 * Returns the global volume value.
 */
export function getVolumeValue(): number {
    return globalThis.animeConVolumeValue ?? /* default= */ 0;
}

/**
 * Sets the global volume value to the given `value`.
 */
export function setVolumeValue(value: number): void {
    globalThis.animeConVolumeValue = value;
}

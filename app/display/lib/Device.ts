// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { EventHandler } from 'react';

/**
 * Define the `globalThis.animeCon` property. This is injected in the WebView used to display the
 * Volunteer Manager on the AnimeCon Display devices, as a message port.
 */
declare module globalThis {
    let animeConEventListener: EventHandler<any>;
    let animeCon: EventTarget & {
        postMessage: (message: string) => void;
    };
}

/**
 * Waits for the given number of `ms`.
 */
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * The Device class contains the necessary functionality for the Volunteer Manager to interact with
 * the Display device.
 */
const kDeviceInstance = new class {
    constructor() {
        if (typeof globalThis.animeCon !== 'undefined') {
            if (typeof globalThis.animeConEventListener !== 'undefined') {
                globalThis.animeCon.removeEventListener(
                    'message', globalThis.animeConEventListener);
            }

            globalThis.animeConEventListener = (event: MessageEvent<string>) => {
                this.onMessage(event.data);
            };

            globalThis.animeCon.addEventListener('message', globalThis.animeConEventListener);
        }
    }

    // ---------------------------------------------------------------------------------------------

    /**
     * Returns whether our code is currently running on a Volunteer Manager Display device.
     */
    public isDevice(): boolean {
        return typeof globalThis.animeCon !== 'undefined';
    }

    // ---------------------------------------------------------------------------------------------

    /**
     * Updates the device's screen brightness to the given `brightness`, which must be a number
     * between 0 and 255. The screen will be updated immediately.
     */
    public async setBrightness(brightness: number): Promise<boolean> {
        if (brightness < 0 || brightness > 255)
            return false;

        return this.executeCommand(`brightness:${brightness}`);
    }

    // ---------------------------------------------------------------------------------------------

    /**
     * Enables Kiosk mode on the device. This will trap the user in the app.
     */
    public async enableKiosk(): Promise<boolean> {
        return this.executeCommand('kiosk:enable');
    }

    /**
     * Disables Kiosk mode on the device. The user will be able to leave the app again.
     */
    public async disableKiosk(): Promise<boolean> {
        return this.executeCommand('kiosk:disable');
    }

    // ---------------------------------------------------------------------------------------------

    /**
     * Disables the light on the device. They will turn off immediately.
     */
    public async disableLight(): Promise<boolean> {
        return await this.executeCommand('light:CLOSE:RED,GREEN,BLUE');
    }

    /**
     * Reconnects the light's serial port by closing the port, then re-opening it. It's fine for the
     * close operation to fail, however the success status of the open operation will be returned.
     */
    public async reconnectLightSerialPort(): Promise<boolean> {
        await this.executeCommand('light:close');
        return await this.executeCommand('light:open');
    }

    /**
     * Updates the device's light to the given colour, indicated by the `red`, `green` and `blue`
     * channels, each of which must be between 0 and 255.
     */
    public async setLightColour(red: number, green: number, blue: number): Promise<boolean> {
        if (red < 0 || green < 0 || blue < 0 || red > 255 || green > 255 || blue > 255)
            return false;

        globalThis.animeCon.postMessage(`light:KEEP:RED:0:${red}`);
        await wait(25);  // let the driver catch up with itself

        globalThis.animeCon.postMessage(`light:KEEP:GREEN:0:${green}`);
        await wait(25);  // let the driver catch up with itself

        return this.executeCommand(`light:KEEP:BLUE:0:${blue}`);
    }

    // ---------------------------------------------------------------------------------------------

    /**
     * Reads the IP addresses that have been assigned to the network interfaces on the device, both
     * IPv4 and IPv6. Convenient for diagnostics.
     */
    public async getIpAddresses(): Promise<string[]> {
        return await this.executeCommand('ip', /* capture= */ 'ip');
    }

    // ---------------------------------------------------------------------------------------------

    #executingCommandCapture: undefined | 'ip';
    #executingCommandMessages: undefined | string[];

    #executingCommandResolver: undefined | ((result: any) => void);

    /**
     * Executes the given `command` on the device. If this code is running on another machine, then
     * this method will shortcut execution and return `false` immediately.
     */
    private async executeCommand<T = boolean>(command: string, capture?: 'ip'): Promise<T> {
        if (!this.isDevice())
            return false as T;

        // If another command is still in flight, opportunistically wait for it to finish. If it
        // doesn't, we fail it and proceed with our own, in case some operation has locked up.
        if (!!this.#executingCommandResolver) {
            await wait(1000);
            if (!!this.#executingCommandResolver)
                this.#executingCommandResolver(/* result= */ false);
        }

        return new Promise(resolve => {
            this.#executingCommandCapture = capture;
            this.#executingCommandMessages = [ /* empty array */ ];
            this.#executingCommandResolver = resolve;

            globalThis.animeCon.postMessage(command);
        });
    }

    /**
     * Called when the given `message` has been received.
     */
    private onMessage(message: string): void {
        if (message.startsWith('success')) {
            switch (this.#executingCommandCapture) {
                case 'ip':
                    return this.#executingCommandResolver?.(this.#executingCommandMessages);
                default:
                    return this.#executingCommandResolver?.(/* result= */ true);
            }
        } else if (message.startsWith('error')) {
            switch (this.#executingCommandCapture) {
                case 'ip':
                    return this.#executingCommandResolver?.([ /* no addresses */ ]);
                default:
                    return this.#executingCommandResolver?.(/* result= */ false);
            }
        } else if (!!this.#executingCommandCapture) {
            if (message.startsWith(this.#executingCommandCapture)) {
                this.#executingCommandMessages?.push(
                    message.substring(this.#executingCommandCapture.length + 1));
            }
        }
    }
};

/**
 * Export the instance as the default export, allowing it to be used like `import device from foo`.
 */
export default kDeviceInstance;

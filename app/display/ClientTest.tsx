// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function ClientTest() {
    const [ messages, setMessages ] = useState<string[]>([]);

    useEffect(() => {
        if (typeof globalThis.animeCon === 'undefined')
            return;

        function messageListener(event: any) {
            setMessages(messages => [ event.data, ...messages ]);
        }

        globalThis.animeCon.addEventListener('message', messageListener);
        return () => globalThis.animeCon.removeEventListener('message', messageListener);

    }, [ /* no dependencies */ ]);

    function setBrightness(value: number) {
        globalThis.animeCon.postMessage(`brightness:${value}`);
    }

    function setKiosk(enabled: boolean) {
        globalThis.animeCon.postMessage(`kiosk:${enabled ? 'enable' : 'disable'}`);
    }

    async function setLight(r: number, g: number, b: number) {
        globalThis.animeCon.postMessage(`light:KEEP:RED:0:${r}`);
        await wait(30);
        globalThis.animeCon.postMessage(`light:KEEP:GREEN:0:${g}`);
        await wait(40);
        globalThis.animeCon.postMessage(`light:KEEP:BLUE:0:${b}`);
    }

    function openLight(open: boolean) {
        globalThis.animeCon.postMessage(`light:${open ? 'open' : 'close'}`);
    }

    function requestIp() {
        globalThis.animeCon.postMessage('ip');
    }

    return (
        <Paper sx={{ p: 2, m: 4 }}>
            <Typography variant="h5">
                Display test component
            </Typography>
            <Stack direction="column" spacing={2} sx={{ my: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="subtitle1">
                        Brightness
                    </Typography>
                    <Button variant="outlined" onClick={ () => setBrightness(50) }>50</Button>
                    <Button variant="outlined" onClick={ () => setBrightness(150) }>150</Button>
                    <Button variant="outlined" onClick={ () => setBrightness(255) }>255</Button>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="subtitle1">
                        Kiosk
                    </Typography>
                    <Button variant="outlined" onClick={ () => setKiosk(true) }>Enable</Button>
                    <Button variant="outlined" onClick={ () => setKiosk(false) }>Disable</Button>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="subtitle1">
                        Light
                    </Typography>
                    <Button variant="outlined" onClick={ () => setLight(255, 0, 0) }>Red</Button>
                    <Button variant="outlined" onClick={ () => setLight(0, 255, 0) }>Green</Button>
                    <Button variant="outlined" onClick={ () => setLight(0, 0, 255) }>Blue</Button>
                    <Button variant="outlined" onClick={ () => setLight(255, 255, 0) }>
                        Yellow
                    </Button>
                    <Button variant="outlined" onClick={ () => setLight(255, 255, 255) }>
                        White
                    </Button>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="subtitle1">
                        Light²
                    </Typography>
                    <Button variant="outlined" onClick={ () => openLight(true) }>Open</Button>
                    <Button variant="outlined" onClick={ () => openLight(false) }>Close</Button>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="subtitle1">
                        Misc
                    </Typography>
                    <Button variant="outlined" onClick={ () => requestIp() }>IP</Button>
                </Stack>
            </Stack>
            <Box>
                <ul>
                    { messages.map((message, index) =>
                        <li key={index}>{message}</li> )}
                </ul>
            </Box>
        </Paper>
    );
}

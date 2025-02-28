// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { TextDecoder, TextEncoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// TODO: Remove this once Next.js auth interrupts are stable.
process.env.__NEXT_EXPERIMENTAL_AUTH_INTERRUPTS = 'true';

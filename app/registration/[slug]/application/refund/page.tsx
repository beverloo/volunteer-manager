// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { default as MuiLink } from '@mui/material/Link';
import Box from '@mui/material/Box';

import type { NextRouterParams } from '@lib/NextRouterParams';
import { Markdown } from '@components/Markdown';
import { Privilege, can } from '@lib/auth/Privileges';
import { contextForRegistrationPage } from '../../contextForRegistrationPage';
import { generatePortalMetadataFn } from '../../../generatePortalMetadataFn';
import { getStaticContent } from '@lib/Content';

/**
 * The <EventApplicationRefundPage> component allows volunteers to request a refund for their ticket
 * after the event has finished. Availability of this page is time limited, and we want it to give
 * a message (as opposed to a HTTP 404 Not Found) even when the user is signed out.
 */
export default async function EventApplicationRefundPage(props: NextRouterParams<'slug'>) {
    // TODO: Signed out
    // TODO: Not yet available
    // TODO: Request refund (+confirmation)
    // TODO: Not available anymore (+confirmation)

    return (
        <p>Hi</p>
    );
}

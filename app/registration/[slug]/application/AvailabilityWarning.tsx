// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { default as MuiLink } from '@mui/material/Link';
import Alert from '@mui/material/Alert';

import type { AvailabilityWindowStatus } from '@lib/isAvailabilityWindowOpen';
import { Temporal, formatDate } from '@lib/Temporal';

/**
 * Number of hours prior to the availability window closing that a warning should be shown.
 */
const kWindowCloseWarningHours = 14 * 24;

/**
 * Props accepted by the <AvailabilityWarning> component.
 */
interface AvailabilityWarningProps {
    /**
     * Whether the signed in user has access through an override.
     */
    override: boolean;

    /**
     * Status of the availability window for which we may be displaying a warning.
     */
    window: AvailabilityWindowStatus;
}

/**
 * The <AvailabilityWarning> component displays a warning regarding the availability of choice for
 * the given component. People with an override receive a warning, whereas everyone else receives
 * an error message in case the window has closed already.
 */
export function AvailabilityWarning(props: AvailabilityWarningProps) {
    switch (props.window.status) {
        // Note: messages in the 'pending' state will only be shown to volunteering leads who have
        // planning access to this particular part of the organisation. Regular volunteers will
        // never see those messages, as detail pages will respond with HTTP 404 Not Found instead.
        case 'pending': {
            if (!!props.window.open) {
                const windowOpenTime = Temporal.ZonedDateTime.from(props.window.open);
                const windowOpenDate = formatDate(windowOpenTime, 'dddd, MMMM Do');

                return (
                    <Alert severity="warning" sx={{ typography: 'body2' }}>
                        Preferences cannot be shared by volunteers yet. The functionality is
                        scheduled to become available on {windowOpenDate}.
                    </Alert>
                );
            }

            return (
                <Alert severity="warning">
                    Preferences cannot be shared by volunteers yet. No date has been configured at
                    which the functionality will become available.
                </Alert>
            );
        }

        case 'current': {
            if (!props.window.close)
                return undefined;  // no need for a warning - no close date set

            const currentTime = Temporal.Now.instant();

            const windowCloseTime = Temporal.ZonedDateTime.from(props.window.close);
            const windowCloseInstant = windowCloseTime.toInstant();

            const differenceInHours = currentTime.until(windowCloseInstant, {
                largestUnit: 'hour',
            });

            if (differenceInHours.hours > kWindowCloseWarningHours)
                return undefined;  // no need for a warning - too far into the future

            const windowCloseDate = formatDate(windowCloseTime, 'dddd, MMMM Do');

            return (
                <Alert severity="warning">
                    Please submit your preferences soon, as they will be locked on{' '}
                    {windowCloseDate} to allow us to proceed with planning.
                </Alert>
            );
        }

        case 'missed': {
            const windowCloseTime = Temporal.ZonedDateTime.from(props.window.close);
            const windowCloseDate = formatDate(windowCloseTime, 'dddd, MMMM Do');

            return (
                <Alert severity="error">
                    The window to share your preferences closed on {windowCloseDate}. If you have
                    any questions, please feel free to e-mail us at{' '}
                    <MuiLink href="mailto:crew@animecon.nl">crew@animecon.nl</MuiLink>.
                </Alert>
            );
        }
    }
}

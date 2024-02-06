// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { Temporal } from '@lib/Temporal';
import { z } from 'zod';

/**
 * Zod type validating that the input conforms to `Temporal.PlainDate` constraints.
 */
export const kTemporalPlainDate =
    z.string().transform((value, context) => {
        try {
            return Temporal.PlainDate.from(value);
        } catch (error: any) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Only plain dates are accepted (YYYY-MM-DD)',
            });
        }

        return z.NEVER;
    });

/**
 * Zod type validating that the input conforms to `Temporal.PlainTime` constraints.
 */
export const kTemporalPlainTime =
    z.string().transform((value, context) => {
        try {
            return Temporal.PlainTime.from(value);
        } catch (error: any) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Only plain times are accepted (HH:mm:ss)',
            });
        }

        return z.NEVER;
    });

/**
 * Zod type validating that the input conforms to `Temporal.ZonedDateTime` constraints.
 */
export const kTemporalZonedDateTime =
    z.string().transform((value, context) => {
        try {
            return Temporal.Instant.from(value).toZonedDateTimeISO('UTC');
        } catch (error: any) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Only plain times are accepted (HH:mm:ss)',
            });
        }

        return z.NEVER;
    });

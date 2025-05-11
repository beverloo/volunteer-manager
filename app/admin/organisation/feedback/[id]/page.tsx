// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { default as MuiLink } from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import type { NextPageParams } from '@lib/NextRouterParams';
import { LocalDateTime } from '@app/admin/components/LocalDateTime';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { requireAuthenticationContext } from '@lib/auth/AuthenticationContext';
import db, { tFeedback, tUsers } from '@lib/database';

/**
 * This page displays an individual piece of received feedback to the user. Display is trimmed by
 * default, so gaining access to the comprehensive feedback is important.
 */
export default async function FeedbackDetailPage(props: NextPageParams<'id'>) {
    const { id } = await props.params;

    await requireAuthenticationContext({
        check: 'admin',
        permission: 'organisation.feedback',
    });

    const usersJoin = tUsers.forUseInLeftJoin();

    const dbInstance = db;
    const feedback = await dbInstance.selectFrom(tFeedback)
        .leftJoin(usersJoin)
            .on(usersJoin.userId.equals(tFeedback.userId))
        .where(tFeedback.feedbackId.equals(parseInt(id, /* radix= */ 10)))
        .select({
            date: dbInstance.dateTimeAsString(tFeedback.feedbackDate),
            name: tFeedback.feedbackName,
            user: {
                id: usersJoin.userId,
                name: usersJoin.name,
            },
            feedback: tFeedback.feedbackText,
        })
        .executeSelectNoneOrOne();

    if (!feedback)
        notFound();

    const author = feedback.name || feedback.user?.name;

    return (
        <>
            <Section title="Feedback" subtitle={author}>
                <SectionIntroduction>
                    This page displays feedback received by one of our volunteers. Please consider
                    it and reach out to the volunteer to let them know what you think.
                </SectionIntroduction>
                <Table sx={{ mt: '0px !important' }}>
                    <TableBody>
                        <TableRow>
                            <TableCell width="25%" component="th" scope="row">Author</TableCell>
                            <TableCell>
                                { !feedback.user && feedback.name }
                                { !!feedback.user &&
                                    <MuiLink
                                        component={Link}
                                        href={`/admin/organisation/accounts/${feedback.user.id}`}>
                                        {feedback.user.name}
                                    </MuiLink> }
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell width="25%" component="th" scope="row">Date</TableCell>
                            <TableCell>
                                <LocalDateTime dateTime={feedback.date}
                                               format="YYYY-MM-DD HH:mm:ss" />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Section>
            <Section noHeader>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {feedback.feedback}
                </Typography>
            </Section>
        </>
    );
}

export const metadata: Metadata = {
    title: 'Feedback | AnimeCon Volunteer Manager',
};

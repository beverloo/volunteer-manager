// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import Link from 'next/link';
import { useContext } from 'react';

import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardHeader from '@mui/material/CardHeader';

import Paper from '@mui/material/Paper';

import { Alert } from '../components/Alert';
import { ScheduleContext } from '../ScheduleContext';
import { KnowledgeBaseIcon } from '@components/KnowledgeBaseIcon';
import { setTitle } from '../ScheduleTitle';

/**
 * The <KnowledgeBaseCategories> component uses the schedule app's context to display an ordered
 * list of the knowledge base categories known to this particular event.
 */
export function KnowledgeBaseCategories() {
    const { schedule } = useContext(ScheduleContext);
    if (!schedule || !schedule.knowledge.length) {
        return (
            <Paper>
                <Alert severity="error">
                    The knowledge base for this event is not available yet.
                </Alert>
            </Paper>
        );
    }

    setTitle('Knowledge Base');

    return (
        <>
            { schedule.knowledge.map((category) =>
                <Card key={category.id}>
                    <CardActionArea LinkComponent={Link} href={`./knowledge/${category.id}`}>
                        <CardHeader avatar={ <KnowledgeBaseIcon variant={category.icon} /> }
                                    title={category.title}
                                    titleTypographyProps={{ variant: 'subtitle2' }}
                                    subheader={category.description} />
                    </CardActionArea>
                </Card> )}
        </>
    );
}

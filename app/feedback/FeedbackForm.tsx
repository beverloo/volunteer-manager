// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Props accepted by the <FeedbackForm> component.
 */
export interface FeedbackFormProps {
    /**
     * Array of volunteers who participate in the latest event.
     */
    volunteers: {
        id: number;
        name: string;
        role: string;
        team: string;
    }[];
}

/**
 * The <FeedbackForm> component displays a form that allows volunteering leads to submit feedback
 * on behalf of one of our volunteers. It receives the list of volunteers who help us out already.
 */
export function FeedbackForm(props: FeedbackFormProps) {
    return (
        <>
            TODO ({props.volunteers.length} volunteers)
        </>
    );
}

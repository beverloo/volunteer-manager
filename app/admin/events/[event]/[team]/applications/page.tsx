// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { NextPageParams } from '@lib/NextRouterParams';
import type { PartialServerAction, ServerAction } from '@lib/serverAction';
import { ApplicationForm } from './ApplicationForm';
import { FormGridSection } from '@app/admin/components/FormGridSection';
import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';
import { verifyAccessAndFetchPageInfo } from '@app/admin/events/verifyAccessAndFetchPageInfo';

import * as actions from './ApplicationActions';

/**
 * The <ApplicationsPage> allows team leads to see individuals who have applied to participate in
 * their teams, and, when sufficient permission has been granted, to approve or reject such
 * applications.
 */
export default async function ApplicationsPage(props: NextPageParams<'event' | 'team'>) {
    const params = await props.params;
    const accessScope = {
        event: params.event,
        team: params.team,
    };

    const { access, event, team, user } = await verifyAccessAndFetchPageInfo(props.params, {
        permission: 'event.applications',
        operation: 'read',
        scope: accessScope,
    });

    // ---------------------------------------------------------------------------------------------
    // Actions available to the user depend on the permissions they have been granted, and is
    // conveyed through the existence of Server Action references shared with the client.
    // ---------------------------------------------------------------------------------------------

    let approveApplicationFn: PartialServerAction<number> | undefined;
    let moveApplicationFn: PartialServerAction<number> | undefined;
    let rejectApplicationFn: PartialServerAction<number> | undefined;

    if (access.can('event.applications', 'update', accessScope)) {
        approveApplicationFn = actions.approveApplication.bind(null, event.slug, team.slug);
        moveApplicationFn = actions.moveApplication.bind(null, event.slug, team.slug);
        rejectApplicationFn = actions.rejectApplication.bind(null, event.slug, team.slug);
    }

    let createApplicationFn: ServerAction | undefined;
    let reconsiderApplicationFn: PartialServerAction<number> | undefined;

    if (access.can('event.applications', 'create', accessScope)) {
        createApplicationFn = actions.createApplication.bind(null, event.slug, team.slug);
        reconsiderApplicationFn = actions.reconsiderApplication.bind(null, event.slug, team.slug);
    }

    // ---------------------------------------------------------------------------------------------

    // Values that should be prepopulated in the "Create an Application" form.
    const createValues = {
        serviceHours: '20',
        serviceTiming: '10-0',
    };

    // Whether the signed in user has the ability to link through to their volunteering account.
    const canAccessAccounts = access.can('organisation.accounts', 'read');

    // Whether the signed in user has the ability to commit actions without communication.
    const canRespondSilently = access.can('volunteer.silent');

    return (
        <>
            <Section title="Applications" subtitle={team.name}>
                <SectionIntroduction>
                    This page displays all volunteer applications submitted for this team. Please
                    aim to review and respond to each application within a week to ensure timely
                    communication with the applicants. Discuss criteria with your Staff member.
                </SectionIntroduction>
            </Section>
            { /* TODO: Applications */ }
            { !!createApplicationFn &&
                <FormGridSection action={createApplicationFn} title="Create an application"
                                 callToAction="Create the application" defaultValues={createValues}>
                    <SectionIntroduction important>
                        This feature lets you quickly create an application on behalf of any
                        registered volunteer. Please make sure all information is accurate, as you
                        are responsible for its correctness. The application will still need to be
                        approved, at which point the volunteer will be notified.
                    </SectionIntroduction>
                    <ApplicationForm eventId={event.id} />
                </FormGridSection> }
            { /* TODO: Rejected applications */ }
        </>
    );
}

// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import type { EventPromptContext, EventPromptParams } from './EventPrompt';
import { EventPrompt } from './EventPrompt';
import { tEnvironments, tEventsTeams, tTeams } from '@lib/database';

/**
 * Context that has been collected by the prompt structure.
 */
export interface TeamEventPromptContext extends EventPromptContext {
    /**
     * Context about the team with which the message will be associated.
     */
    team: {
        name: string;
        shortName: string;
        description: string;

        domain: string;
        domainSlug: string;

        requestConfirmation: boolean;
        whatsApp?: string;
    };
}

/**
 * Parameters that are expected to be available for the prompt.
 */
export interface TeamEventPromptParams extends EventPromptParams {
    /**
     * URL-safe slug representing the team with which this prompt is associated.
     */
    team: string;
}

/**
 * The `TeamEventPrompt` class represents a prompt that is associated with a particular event,
 * source volunteer, target volunteer and a team the target volunteer is, or may become part of.
 */
export abstract class TeamEventPrompt
    <Context extends TeamEventPromptContext = TeamEventPromptContext,
     Params extends TeamEventPromptParams = TeamEventPromptParams>
    extends EventPrompt<Context, Params>
{
    /**
     * Collects information about the event and the volunteer and makes it available to the context,
     * based on which the message will be composed.
     */
    override async collectContext(params: Params): Promise<TeamEventPromptContext> {
        const base = await super.collectContext(params);
        return {
            ...base,
            team: await this.fetchTeamInfo(base, params.team),
        };
    }

    /**
     * Fetches the team info for the given team, identified by the `teamSlug`, from the database
     * using the given `context` to specify the relevant event.
     */
    protected async fetchTeamInfo(context: EventPromptContext, teamSlug: string)
        : Promise<TeamEventPromptContext['team']>
    {
        const eventsTeamsJoin = tEventsTeams.forUseInLeftJoin();

        const numberOfTeamsForEnvironment = this.db.subSelectUsing(tTeams)
            .from(tEnvironments)
                .where(tEnvironments.environmentId.equals(tTeams.teamEnvironmentId))
                    .and(tEnvironments.environmentDeleted.isNull())
            .selectCountAll()
            .forUseAsInlineQueryValue();

        const team = await this.db.selectFrom(tTeams)
            .innerJoin(tEnvironments)
                .on(tEnvironments.environmentId.equals(tTeams.teamEnvironmentId))
                    .and(tEnvironments.environmentDeleted.isNull())
            .leftJoin(eventsTeamsJoin)
                .on(eventsTeamsJoin.eventId.equals(context.event.id))
                    .and(eventsTeamsJoin.teamId.equals(tTeams.teamId))
                    .and(eventsTeamsJoin.enableTeam.equals(/* true= */ 1))
            .where(tTeams.teamSlug.equals(teamSlug))
            .select({
                name: tTeams.teamTitle,
                shortName: tTeams.teamName,
                description: tTeams.teamDescription,
                slug: tTeams.teamSlug,

                domain: tEnvironments.environmentDomain,
                domainOccupants: numberOfTeamsForEnvironment,

                requestConfirmation: tTeams.teamFlagRequestConfirmation.equals(/* true= */ 1),
                whatsApp: eventsTeamsJoin.whatsappLink,
            })
            .executeSelectOne();

        return {
            ...team,

            // The registration portal's slug to use on the given environment depends on the
            // number of team tenants on that environment.
            domainSlug:
                team.domainOccupants === 1 ? context.event.slug
                                           : `${context.event.slug}-${team.slug}`
        };
    }
}

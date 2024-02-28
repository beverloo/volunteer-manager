// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

import { Section } from '@app/admin/components/Section';
import { SectionIntroduction } from '@app/admin/components/SectionIntroduction';

/**
 * Props accepted by the <KnowledgeConfiguration> component.
 */
export interface KnowledgeConfigurationProps {
    // TODO
}

/**
 * The <KnowledgeConfiguration> component allows administrators to configure the knowledge base,
 * which includes publishing the base and the ability to import knowledge from another event.
 */
export function KnowledgeConfiguration(props: KnowledgeConfigurationProps) {
    // TODO: Give `Section` a Privilege to signal that access is restricted.

    return (
        <Section title="Configuration">
            <SectionIntroduction important>
                The configuration options have not been implemented yet.
            </SectionIntroduction>
        </Section>
    );
}

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { PromptBuilder } from './PromptBuilder';

/**
 * Prompt generator for the situation in which a volunteer's application has been approved, and we
 * want to share the news with them.
 */
export class ApproveVolunteerPromptBuilder extends PromptBuilder {
    constructor() {
        super('gen-ai-prompt-approve-volunteer');
    }
}

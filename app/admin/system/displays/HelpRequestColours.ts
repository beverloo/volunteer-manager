// Copyright 2024 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { DisplayHelpRequestTarget } from '@lib/database/Types';

/**
 * Colours to assign to the chips used to categorise help requests.
 */
export const kHelpRequestColours:
    { [k in DisplayHelpRequestTarget]: [ /* fg= */ string, /* bg= */ string ] } =
{
    [DisplayHelpRequestTarget.Crew]: [ '#ffffff', '#5d4037' ],
    [DisplayHelpRequestTarget.Nardo]: [ '#000000', '#ffeb3b' ],
    [DisplayHelpRequestTarget.Stewards]: [ '#ffffff', '#303f9f' ],
};

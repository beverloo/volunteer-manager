// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { useMemo } from 'react';

import type { Theme } from '@mui/material/styles';
import type { AvatarProps as MuiAvatarProps } from '@mui/material/Avatar';
import { default as MuiAvatar } from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import { styled } from '@mui/material/styles';

/**
 * Sizes in which the avatars can be displayed. Keys will automatically be used for typing.
 */
const kAvatarSizeMap = {
    small: { avatarSize: 24, badgeSize: 12 },
    medium: { avatarSize: 40, badgeSize: 20 },
    large: { avatarSize: 80, badgeSize: 24 },
};

/**
 * Variant of the <Badge> component containing styling to make the included badge stand out better
 * on top of a paper background.
 */
const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        fontSize: 'inherit',

        '& svg': { fontSize: 'inherit', overflow: 'visible' },
        '& svg path': {
            paintOrder: 'stroke',
            stroke: theme.palette.background.paper,
            strokeWidth: '4px',
        },
    },
}));

/**
 * Determines the name based on the given `children`, which can either be omitted, a string or an
 * array of strings, which is determined by React through some dark magic.
 */
function determineName(children?: string | string[]): string {
    if (Array.isArray(children))
        return children.join(' ').trim();
    else if (typeof children === 'string')
        return children.trim();
    else
        return '';  // the empty string
}

/**
 * Determines the initials based on the given `name`, which is a string derived from contents passed
 * to <Avatar>. An empty string will be returned when the initials cannot be determined.
 */
function determineInitials(name: string): string {
    const initials = [];
    for (let index = 0; index < name.length; ++index) {
        if (name.charCodeAt(index) < 65 || name.charCodeAt(index) > 90)
            continue;

        initials.push(name[index]);
    }

    return initials.length ? initials.slice(0, 2).join('')
                           : name[0].toUpperCase();
}

/**
 * Determines the colour for the avatar based on the given `name`. This algorithm is borrowed from
 * the MUI documentation: https://mui.com/material-ui/react-avatar/
 */
function determineColour(name: string): string {
    let hash = 0;
    for (let index = 0; index < name.length; ++index)
        hash = name.charCodeAt(index) + ((hash << 5) - hash);

    const colour = [];
    for (let component = 0; component < 3; ++component)
        colour.push(`00${((hash >> (component * 8)) & 0xff).toString(16)}`.slice(-2));

    return `#${colour.join('')}`;
}

/**
 * Props accepted by the <Avatar> component.
 */
export interface AvatarProps {
    /**
     * The badge that should be displayed on the avatar, if any. It will be displayed in the bottom-
     * right corner considering the `variant`.
     */
    badge?: JSX.Element | null;

    /**
     * Children passed to the <Avatar> component. When given, must be a string based on which the
     * person's initials will be derived in case no valid `src` is given.
     */
    children?: string | string[];

    /**
     * Colour in which the avatar should be displayed. Will be computed by default.
     */
    color?: string;

    /**
     * Size in which the avatar should be displayed. Defaults to "medium".
     */
    size?: keyof typeof kAvatarSizeMap;

    /**
     * URL to the source image of the avatar. Can be any valid URI, including data: URIs.
     */
    src?: string;

    /**
     * The variant, determining how the avatar should be displayed. Defaults to "circular".
     */
    variant?: MuiAvatarProps['variant'];

    // TODO: editable
}

/**
 * The <Avatar> component displays a person's avatar and provides functionality for customization
 * and further attribution, such as a small badge. Server-side image optimization will be used for
 * the images, to avoid wasting traffic.
 */
export function Avatar(props: AvatarProps) {
    const { name, backgroundColor, initials } = useMemo(() => {
        const name = determineName(props.children);
        const backgroundColor = props.color ?? determineColour(name);

        return {
            name, backgroundColor,
            initials: determineInitials(name),
        };

    }, [ props.children, props.color ]);

    const color = (theme: Theme) => theme.palette.getContrastText(backgroundColor);
    const { avatarSize, badgeSize } = kAvatarSizeMap[props.size ?? 'medium'];

    // The <MuiAvatar> of the main content. May be wrapped in a <Badge> component when a badge has
    // been specified, or be returned as the JSX from this component.
    const avatar = (
        <MuiAvatar alt={`Avatar associated with ${name}`}
                    src={props.src}
                    sx={{ backgroundColor, color, width: avatarSize, height: avatarSize }}
                    variant={props.variant}>
            {initials}
        </MuiAvatar>
    );

    if (props.badge) {
        return (
            <StyledBadge anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                         badgeContent={props.badge}
                         overlap={ props.variant === 'square' ? 'rectangular' : 'circular' }
                         sx={{ fontSize: badgeSize }}>
                {avatar}
            </StyledBadge>
        );
    }

    return avatar;
}

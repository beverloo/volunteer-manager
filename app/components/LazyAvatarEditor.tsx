// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import dynamic from 'next/dynamic';

import type { AvatarEditorProps } from './AvatarEditor';

/**
 * Lazily load the <AvatarEditor> component, skip server-side rendering.
 */
const AvatarEditor = dynamic(() => import('./AvatarEditor'), { ssr: false });

/**
 * Wrapper around the <AvatarEditor> component that will lazily load the component.
 */
export function LazyAvatarEditor(props: AvatarEditorProps) {
    return <AvatarEditor {...props} />;
}

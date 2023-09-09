// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

'use client';

// -------------------------------------------------------------------------------------------------
// Don't include this file directly, instead use //app/admin/content/ContentEditor.tsx
// -------------------------------------------------------------------------------------------------

import Box from '@mui/material/Box';
import {
    BlockTypeSelect, BoldItalicUnderlineToggles, CreateLink, DiffSourceToggleWrapper, ListsToggle,
    MDXEditor, type MDXEditorMethods, Separator, UndoRedo, diffSourcePlugin, headingsPlugin,
    imagePlugin,  linkPlugin, listsPlugin, markdownShortcutPlugin, quotePlugin, tablePlugin,
    thematicBreakPlugin, toolbarPlugin } from '@mdxeditor/editor';

/**
 * Props accepted by the <ContentEditorMdx> component.
 */
export interface ContentEditorMdxProps {
    /**
     * The Markdown that should be displayed within the component.
     */
    markdown?: string;

    /**
     * The ref that should be passed to the underlying <MDXEditor> component.
     */
    innerRef?: React.Ref<MDXEditorMethods>;
}

/**
 * The <ContentEditorMdx> component is our implementation of the MDXEditor component, with all the
 * plugins loaded that we require. It's designed to be embedded within the <ContentEditor>.
 */
export default function ContentEditorMdx(props: ContentEditorMdxProps) {
    return (
        <Box sx={{ '& [contenteditable="true"]': { fontFamily: 'Roboto', padding: 0 } }}>
            <MDXEditor contentEditableClassName=""
                       ref={props.innerRef}
                       markdown={props.markdown ?? ''}
                       plugins={[
                           diffSourcePlugin({ diffMarkdown: props.markdown }),
                           headingsPlugin(),
                           imagePlugin(),
                           linkPlugin(),
                           listsPlugin(),
                           markdownShortcutPlugin(),
                           quotePlugin(),
                           tablePlugin(),
                           thematicBreakPlugin(),
                           toolbarPlugin({
                               toolbarContents: () =>
                                   <DiffSourceToggleWrapper>
                                       <UndoRedo />
                                       <Separator />
                                       <BoldItalicUnderlineToggles />
                                       <Separator />
                                       <CreateLink />
                                       <ListsToggle />
                                       <Separator />
                                       <BlockTypeSelect />
                                   </DiffSourceToggleWrapper>
                           })
                       ]} />
        </Box>
    );
}

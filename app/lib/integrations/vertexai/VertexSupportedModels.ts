// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Enumeration of the models that are supported by the Vertex AI API.
 */
export const kVertexSupportedModels = {
    // https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-pro
    'gemini-2.5-pro-preview-03-25': 'gemini-2.5-pro-preview-03-25',

    // https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-0-flash
    'gemini-2.0-flash-live-preview-04-09': 'gemini-2.0-flash-live-preview-04-09',
    'gemini-2.0-flash-001': 'gemini-2.0-flash-001',

    // https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-0-flash-lite
    'gemini-2.0-flash-lite-001': 'gemini-2.0-flash-lite-001',

    // https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/1-5-flash
    'gemini-1.5-flash-002': 'gemini-1.5-flash-002',
    'gemini-1.5-flash-001': 'gemini-1.5-flash-001',

    // https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/1-5-pro
    'gemini-1.5-pro-001': 'gemini-1.5-pro-001',

} as const;

/**
 * Enumeration of the models that are supported by the Vertex AI API.
 */
export type VertexSupportedModels =
    typeof kVertexSupportedModels[keyof typeof kVertexSupportedModels];

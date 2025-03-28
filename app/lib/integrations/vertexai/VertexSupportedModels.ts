// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Enumeration of the models that are supported by the Vertex AI API.
 */
export const kVertexSupportedModels = {
    'gemini-2.0-flash-exp': 'gemini-2.0-flash-exp',
    'gemini-1.5-flash-002': 'gemini-1.5-flash-002',
    'gemini-1.5-flash-001': 'gemini-1.5-flash-001',
    'gemini-1.5-pro-001': 'gemini-1.5-pro-001',
    'gemini-1.0-pro-002': 'gemini-1.0-pro-002',
    'gemini-exp-1206': 'gemini-exp-1206',
} as const;

/**
 * Enumeration of the models that are supported by the Vertex AI API.
 */
export type VertexSupportedModels =
    typeof kVertexSupportedModels[keyof typeof kVertexSupportedModels];

// Copyright 2023 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Type referring to a constructor that, when invoked, yields an object that corresponds to T.
 */
export type Constructor<T> = new (...args: any[]) => T;

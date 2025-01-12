// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Base type that interval nodes must implement in order to be used with the StaticIntervalTree.
 */
export type IntervalNodeBase = {
    /**
     * The start of the interval, inclusive.
     */
    start: number;

    /**
     * The end of the interval, exclusive.
     */
    end: number;
};

/**
 * Implementation of a static interval tree, which is a data structure that allows for efficient
 * querying of intervals. This implementation is not mutable after constructing the tree, which is
 * represented as a regular binary tree created from the sorted input intervals.
 */
export class StaticIntervalTree<IntervalNode extends IntervalNodeBase = IntervalNodeBase> {

    /**
     * Constructs the StaticIntervalTree instance with the given `intervals`. The given intervals
     * are immutable after construction, and will be represented as a balanced binary tree.
     */
    constructor(intervals: IntervalNode[]) {
        // TODO: Implement constructing the interval tree.
    }

    /**
     * Gets the height of the tree, as constructed in memory.
     */
    get height() { return null; }

    /**
     * Gets the size of the tree, i.e. the total number of nodes.
     */
    get size() { return null;}

    /**
     * Returns all intervals that contain the given `point` within their range.
     */
    queryIntervalsContaining(point: number): IntervalNode[] {
        // TODO: Implement containing queries.
        return [];
    }

    /**
     * Returns all intervals that overlap with the interval indicated by the given `start` and
     * optionally `end` arguments. When `end` is omitted, an open interval is assumed.
     */
    queryIntervalsOverlapping(start: number, end?: number): IntervalNode[] {
        // TODO: Implement overlapping queries.
        return [];
    }
}

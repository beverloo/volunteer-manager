// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { StaticIntervalTree } from './StaticIntervalTree';

describe('StaticIntervalTree', () => {
    it.failing('should be able to construct a balanced tree', () => {
        const tree = new StaticIntervalTree([
            { start: 1, end: 2 },
            { start: 3, end: 4 },
            { start: 5, end: 6 },
            { start: 7, end: 8 },
            { start: 9, end: 10 },
        ]);

        expect(tree.height).toBe(3);
        expect(tree.size).toBe(5);
    });

    it.failing('should be able to query intervals containing a specific point in time', () => {
        const tree = new StaticIntervalTree([
            { start: 1, end: 2, name: 'Amy' },
            { start: 3, end: 5, name: 'Ben' },
            { start: 3, end: 4, name: 'Charles' },
            { start: 4, end: 5, name: 'Dave' },
        ]);

        // Case: Node start times are inclusive.
        {
            const results = tree.queryIntervalsContaining(1);
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Amy');
        }

        // Case: Node times are considered within their interval.
        {
            const results = tree.queryIntervalsContaining(1.5);
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Amy');
        }

        // Case: Node end times are exclusive.
        {
            const results = tree.queryIntervalsContaining(2);
            expect(results).toHaveLength(0);
        }

        // Case: All nodes are considered, in case of overlapping times. (Variant A)
        {
            const results = tree.queryIntervalsContaining(3);
            expect(results).toHaveLength(2);
            expect(results[0].name).toBe('Ben');
            expect(results[1].name).toBe('Charles');
        }

        // Case: All nodes are considered, in case of overlapping times. (Variant B)
        {
            const results = tree.queryIntervalsContaining(4);
            expect(results).toHaveLength(2);
            expect(results[0].name).toBe('Ben');
            expect(results[1].name).toBe('Dave');
        }

        // Case: When no nodes exist, nothing is returned.
        {
            const results = tree.queryIntervalsContaining(42);
            expect(results).toHaveLength(0);
        }
    });

    it.failing('should be able to query intervals overlapping with a given interval', () => {
        const tree = new StaticIntervalTree([
            { start: 1, end: 2, name: 'Amy' },
            { start: 3, end: 5, name: 'Ben' },
            { start: 3, end: 4, name: 'Charles' },
            { start: 4, end: 5, name: 'Dave' },
        ]);

        // Case: Node start times are inclusive.
        {
            const results = tree.queryIntervalsOverlapping(1, 2);
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Amy');
        }

        // Case: Node times are considered within their interval.
        {
            const results = tree.queryIntervalsOverlapping(1.25, 1.75);
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Amy');
        }

        // Case: Node end times are exclusive.
        {
            const results = tree.queryIntervalsOverlapping(2, 2.25);
            expect(results).toHaveLength(0);
        }

        // Case: Nodes that end during the interval are considered.
        {
            const results = tree.queryIntervalsOverlapping(1.5, 2.25);
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Amy');
        }

        // Case: Nodes that start during the interval are considered.
        {
            const results = tree.queryIntervalsOverlapping(0, 1.5);
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Amy');
        }

        // Case: Multiple overlapping nodes will be considered, in order. (Variant A)
        {
            const results = tree.queryIntervalsOverlapping(3, 5);
            expect(results).toHaveLength(2);
            expect(results[0].name).toBe('Ben');
            expect(results[1].name).toBe('Charles');
        }

        // Case: Multiple overlapping nodes will be considered, in order. (Variant B)
        {
            const results = tree.queryIntervalsOverlapping(3, 6);
            expect(results).toHaveLength(3);
            expect(results[0].name).toBe('Ben');
            expect(results[1].name).toBe('Charles');
            expect(results[2].name).toBe('Dave');
        }

        // Case: When no nodes exist, nothing is returned.
        {
            const results = tree.queryIntervalsOverlapping(6, 10);
            expect(results).toHaveLength(0);
        }
    });
});

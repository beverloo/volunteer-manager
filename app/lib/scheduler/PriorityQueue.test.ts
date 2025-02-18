// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

import { PriorityQueue, type PriorityQueueComparator } from './PriorityQueue';

describe('PriorityQueue', () => {
    it('should be able to create a new instance', () => {
        const comparator: PriorityQueueComparator<number> = (lhs, rhs) => lhs - rhs;
        const queue = new PriorityQueue(comparator);

        expect(queue).toBeInstanceOf(PriorityQueue);
        expect(queue.size()).toBe(0);

        expect(queue.front()).toBeUndefined();
        expect(queue.back()).toBeUndefined();

        expect(queue.toArray()).toHaveLength(0);
    });

    it('should be able to create a new instance from an array', () => {
        const comparator: PriorityQueueComparator<number> = (lhs, rhs) => lhs - rhs;
        const queue = PriorityQueue.fromArray([ 5, 3, 4, 1, 2 ], comparator);

        expect(queue).toBeInstanceOf(PriorityQueue);
        expect(queue.size()).toBe(5);

        expect(queue.front()).toBe(1);
        expect(queue.back()).toBe(5);

        expect(queue.toArray()).toHaveLength(5);
        expect(queue.toArray()).toEqual([ 1, 2, 3, 4, 5 ]);
    });

    it('should be able to manipulate the queue, and provide access to the front and back', () => {
        const comparator: PriorityQueueComparator<number> = (lhs, rhs) => lhs - rhs;
        const queue = new PriorityQueue(comparator);

        expect(queue.size()).toBe(0);

        expect(queue.front()).toBeUndefined();
        expect(queue.back()).toBeUndefined();

        queue.push(5);
        queue.push(3);
        queue.push(4);
        queue.push(1);
        queue.push(2);

        expect(queue.size()).toBe(5);

        expect(queue.front()).toBe(1);
        expect(queue.back()).toBe(5);

        expect(queue.toArray()).toHaveLength(5);
        expect(queue.toArray()).toEqual([ 1, 2, 3, 4, 5 ]);
    });

    it('should be able to clear the queue', () => {
        const comparator: PriorityQueueComparator<number> = (lhs, rhs) => lhs - rhs;
        const queue = PriorityQueue.fromArray([ 5, 3, 4, 1, 2 ], comparator);

        expect(queue).toBeInstanceOf(PriorityQueue);
        expect(queue.size()).toBe(5);

        queue.clear();

        expect(queue.size()).toBe(0);
        expect(queue.toArray()).toHaveLength(0);
    });

    it('should be able to iterate over the queue', () => {
        const comparator: PriorityQueueComparator<number> = (lhs, rhs) => lhs - rhs;
        const queue = PriorityQueue.fromArray([ 5, 3, 4, 1, 2 ], comparator);

        expect(queue.toArray()).toHaveLength(5);
        expect(queue.toArray()).toEqual([ 1, 2, 3, 4, 5 ]);

        const values = [];
        for (const element of queue)
            values.push(element);

        expect(values).toHaveLength(5);
        expect(values).toEqual([ 1, 2, 3, 4, 5 ]);
    });
});

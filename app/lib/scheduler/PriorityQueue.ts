// Copyright 2025 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be found in the LICENSE file.

/**
 * Comparator function that can be used to compare two elements in a priority queue.
 */
export type PriorityQueueComparator<T> = (lhs: T, rhs: T) => number;

/**
 * Implementation of a generic priority queue, that will be sorted based on the comparator function
 * provided in the construction. Provides O(1) access to the front and back of the queue, and
 * O(log n) time on insertion of a new element. Constructing a queue can be done at a complexity
 * matching Timsort, used by the v8 JavaScript engine.
 *
 * Note that this implementation is optimised for simplicity and readability, rather than pure
 * performance, based on the current needs of the Volunteering Manager where the queue size will
 * max out to a dozen elements at most.
 *
 * @see https://en.wikipedia.org/wiki/Priority_queue
 * @see https://v8.dev/blog/array-sort
 */
export class PriorityQueue<T> {
    #comparator: PriorityQueueComparator<T>;
    #queue: T[];

    /**
     * Creates a new PriorityQueue instance for the given `values`, using the given `comparator`.
     * The elements will be sorted once, rather than for each insertion operation, making this more
     * efficient than creating and populating it manually.
     */
    static fromArray<T>(values: T[], comparator: PriorityQueueComparator<T>) {
        const queue = new PriorityQueue(comparator);
        queue.#queue = values.sort(comparator);
        return queue;
    }

    constructor(comparator: PriorityQueueComparator<T>) {
        this.#comparator  = comparator;
        this.#queue = [];
    }

    /**
     * Returns the first element in the queue, i.e. the one with the highest priority. Returns
     * `undefined` when the queue is empty.
     */
    front(): T | undefined {
        return this.#queue.length ? this.#queue[0]
                                  : undefined;
    }

    /**
     * Returns the last element in the queue, i.e. the one with the lowest priority. Returns
     * `undefined` when the queue is empty.
     */
    back(): T | undefined {
        return this.#queue.length ? this.#queue[this.#queue.length - 1]
                                  : undefined;
    }

    /**
     * Pushes a new `value` into the priority queue, maintaining the order of elements based on the
     * comparator function provided in the constructor. A sorting operation will be performed to
     * identify where the element should be inserted.
     */
    push(value: T): void {
        let low = 0;
        let high = this.#queue.length;

        while (low < high) {
            const mid = (low + high) >>> 1;
            if (this.#comparator(this.#queue[mid], value) < 0)
                low = mid + 1;
            else
                high = mid;
        }

        this.#queue.splice(low, 0, value);
    }

    /**
     * Removes the first element from the queue, i.e. the one with the highest priority. This method
     * is a no-op when the queue is already empty.
     */
    pop(): void {
        if (this.#queue.length > 0)
            this.#queue.shift();
    }

    /**
     * Clears all elements from the queue. The queue's size will be reset.
     */
    clear(): void {
        this.#queue = [];
    }

    /**
     * Returns the number of elements that have been stored in the queue.
     */
    size() {
        return this.#queue.length;
    }

    /**
     * Creates an iterator that can be used to iterate over the queue, with the elements sorted in
     * priority order.
     */
    *[Symbol.iterator](): IterableIterator<T> {
        for (const element of this.#queue)
            yield element;
    }

    /**
     * Creates a copy of the queue and returns it as an array, with the elements sorted in priority
     * order. When the queue is empty, an empty array will be returned in kind.
     */
    toArray(): T[] {
        return [ ...this.#queue ];
    }
}

/**
 * This implementation is based on the following two GitHub repositories, both MIT licensed. The
 * code is copied as Josh' repository alters the String prototype, which we should avoid, whereas
 * Kenneth's repository doesn't have TypeScript definitions available.
 *
 * The code is used effectively as available in Kenneth's repository, with a few minor consistency
 * improvements aligned with the rest of the code in our repository.
 *
 * https://github.com/knpwrs/string-score (Kenneth Powers, kenpowers.net)
 * https://github.com/joshaven/string_score (Joshaven Potter, joshaven.com)
 */

import { normalizeString, stringScore } from './StringScore';

describe('StringScore', () => {
    const hello = 'Hello, World!';

    it('should return 1.0 when passed two equal strings', () => {
        expect(stringScore('Foo', 'Foo')).toEqual(1.0);
    });

    it('should return 0.0 when passed strings with non-existing characters', () => {
        expect(stringScore('Foo Bar', 'fuu')).toEqual(0.0);
        expect(stringScore('Foo Bar', 'Foo_Bar')).toEqual(0.0);
    });

    it('should return 0.0 when passed an empty query', () => {
        expect(stringScore('Foo Bar', '')).toEqual(0.0);
    });

    it('should only match sequentially', () => {
        expect(stringScore(hello, 'WH')).toEqual(0.0);
    });

    it('should return a better score for the same case rather than the opposite case', () => {
        expect(stringScore(hello, 'hello')).toBeLessThan(stringScore(hello, 'Hello'));
    });

    it('should return a higher score for closer matches', () => {
        expect(stringScore(hello, 'H')).toBeLessThan(stringScore(hello, 'He'));
    });

    it('should return a match with the wrong case', () => {
        expect(stringScore('Hillsdale, Michigan', 'himi')).toBeGreaterThan(0.0);
    });

    it('should have proper relative weighting', () => {
        const str = hello;

        expect(stringScore(str, 'e')).toBeLessThan(stringScore(str, 'h'));
        expect(stringScore(str, 'h')).toBeLessThan(stringScore(str, 'he'));
        expect(stringScore(str, 'hel')).toBeLessThan(stringScore(str, 'hell'));
        expect(stringScore(str, 'hell')).toBeLessThan(stringScore(str, 'hello'));
        expect(stringScore(str, 'hello')).toBeLessThan(stringScore(str, 'helloworld'));
        expect(stringScore(str, 'hello worl')).toBeLessThan(stringScore(str, 'helloworl'));
        expect(stringScore(str, 'hello worl')).toBeLessThan(stringScore(str, 'hello world'));
    });

    it('has a consecutive letter bonus', () => {
        expect(stringScore(hello, 'Hel')).toBeGreaterThan(stringScore(hello, 'Hld'));
    });

    it('has an acronym bonus', () => {
        expect(stringScore(hello, 'HW', 0.5)).toBeGreaterThan(stringScore(hello, 'Ho', 0.5));
        expect(stringScore('Hillsdale Michigan', 'HiMi', 0.5))
            .toBeGreaterThan(stringScore('Hillsdale, Michigan', 'Hil', 0.5));
        expect(stringScore('Hillsdale Michigan', 'HiMi', 0.5))
            .toBeGreaterThan(stringScore('Hillsdale, Michigan', 'illsda', 0.5));
        expect(stringScore('Hillsdale Michigan', 'HiMi', 0.5))
            .toBeGreaterThan(stringScore('Hillsdale, Michigan', 'Hills', 0.5));
        expect(stringScore('Hillsdale Michigan', 'HiMi', 0.5))
            .toBeGreaterThan(stringScore('Hillsdale, Michigan', 'hillsd', 0.5));
    });

    it('has a beginning of string bonus', () => {
        expect(stringScore('Hillsdale', 'hi')).toBeGreaterThan(stringScore('Hillsdale', 'dale'));
        expect(stringScore(hello, 'h')).toBeGreaterThan(stringScore(hello, 'w'));
    });

    it('has proper string weights', () => {
        expect(stringScore('Research Resources North', 'res'))
            .toBeGreaterThan(stringScore('Mary Conces', 'res'));
        expect(stringScore('Research Resources North', 'res'))
            .toBeGreaterThan(stringScore('Mary had a resourceful little lamb.', 'res'));
    });

    it('should score mismatched strings', () => {
        expect(stringScore(hello, 'Hz')).toEqual(0);
        expect(stringScore(hello, 'Hz', 0.5)).toBeGreaterThan(0);
        expect(stringScore(hello, 'Hz', 0.5)).toBeLessThan(stringScore(hello, 'He', 0.5));
    });

    it('should be tuned well', () => {
        expect(stringScore(hello, 'Hello, Worl', 0.5))
            .toBeGreaterThan(stringScore(hello, 'Hello, Worl1'));
        expect(stringScore(hello, 'jello', 0.5)).toBeGreaterThan(0);
    });

    it('should have varying degrees of fuzziness', () => {
        expect(stringScore(hello, 'Hz', 0.9)).toBeGreaterThan(stringScore(hello, '0.5'));
    });

    it('should be able to normalize accent marks away from strings', () => {
        expect(normalizeString('Hello')).toEqual('hello');
        expect(normalizeString('ä â ë í ő ń ü')).toEqual('a a e i o n u');
    });
});

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

/**
 * Normalizes the |input|. This means changing the string's case to lowercase consistently for all
 * users, where those in modern(ish) browsers will also normalize away accent marks.
 *
 * @param input The input string that is to be normalized.
 * @return The normalized string.
 */
export function normalizeString(input: string): string {
    if (String.prototype.hasOwnProperty('normalize'))
        input = input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return input.toLowerCase();
}

/**
 * Scores a target string against a query string.
 *
 * @param target The target string to score the query against.
 * @param query The query to score against the target string.
 * @param fuzzyFactor A number between 0 and 1 which increases scores of non-perfect matches.
 * @return A number between 0 and 1. 0 being no match and 1 being perfect match.
 */
export function stringScore(target: string, query: string, fuzzyFactor?: number) {
    return stringScoreEx(target, query, normalizeString(query), fuzzyFactor);
}

/**
 * Scores a target string against a query string. This method takes an already lowercased query
 * string for comparison, to reduce the number of redundant string operations.
 *
 * @param target The target string to score the query against.
 * @param query The query to score against the target string.
 * @param queryNormalized The query to score against the target string, in normalized format.
 * @param fuzzyFactor A number between 0 and 1 which increases scores of non-perfect matches.
 * @return A number between 0 and 1. 0 being no match and 1 being perfect match.
 */
export function stringScoreEx(
    target: string, query: string, queryNormalized: string, fuzzyFactor?: number)
{
    if (target === query)
        return 1;

    // If it's not a perfect match and is empty return 0.
    if (query === '')
        return 0;

    const targetLength = target.length;
    const targetNormalized = normalizeString(target);
    const queryLength = query.length;

    let runningScore = 0;
    let startAt = 0;
    let fuzzies = 1;

    // Calculate fuzzy factor.
    fuzzyFactor = fuzzyFactor ? 1 - fuzzyFactor : 0;

    // Walk through query and add up scores.
    for (let i = 0; i < queryLength; ++i) {
        // Find next first case-insensitive match of a character.
        const index = targetNormalized.indexOf(queryNormalized[i], startAt);

        if (index === -1) {
            if (fuzzyFactor)
                fuzzies += fuzzyFactor;
            else
                return 0;
        } else {
            let charScore = 0;
            if (startAt === index) {
                charScore = 0.7;  // start-of-string & consecutive letter bonuses
            } else {
                charScore = 0.1;

                // Acronym Bonus
                // Weighing Logic: Typing the first character of an acronym is as if you
                // preceded it with two perfect character matches.
                if (target[index - 1] === ' ')
                    charScore += 0.8;
            }

            // Same case bonus.
            if (target[index] === query[i])
                charScore += 0.1;

            // Update scores and startAt position for next round of indexOf
            runningScore += charScore;
            startAt = index + 1;
        }
    }

    // Reduce penalty for longer strings.
    let finalScore = 0.5 * (runningScore / targetLength + runningScore / queryLength) / fuzzies;

    if (queryNormalized[0] === targetNormalized[0] && finalScore < 0.85)
        finalScore += 0.15;

    return finalScore;
}

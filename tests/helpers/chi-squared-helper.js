/**
 * Chi-Squared Statistical Test Helper
 * =====================================
 *
 * Provides the chi-squared goodness-of-fit test, used by the distribution
 * tests to verify that die roll outcomes match expected frequencies.
 *
 * Background:
 *   When we roll a d10 many times, each value (1-10) should appear with
 *   equal probability (10%). The chi-squared test quantifies whether the
 *   observed frequencies deviate significantly from the expected frequencies.
 *
 * The test statistic is:
 *   χ² = Σ (observed - expected)² / expected
 *
 * We compare this against the critical value for the desired significance
 * level (alpha) and degrees of freedom (df = number_of_categories - 1).
 *
 * For OOB table ranges, the categories aren't always equally sized:
 *   - Range "1-4" has probability 4/10 = 0.4
 *   - Range "5-6" has probability 2/10 = 0.2
 *   - Range "7-10" has probability 4/10 = 0.4
 *
 * The expected count for each range is: probability × total_iterations
 *
 * Usage in tests:
 *   const { chiSquaredTest } = require('../helpers/chi-squared-helper');
 *   const result = chiSquaredTest(observed, expected, 0.01);
 *   expect(result.pass).toBe(true);
 */

/**
 * Chi-squared critical values for common alpha levels.
 *
 * Table structure: criticalValues[df][alpha] = critical_value
 * If χ² > critical_value, we reject the null hypothesis (distribution
 * is NOT uniform) at the given significance level.
 *
 * df = degrees of freedom = (number of categories - 1)
 * For a d10 with 10 values: df = 9
 * For range objects with varying numbers of ranges: df = ranges.length - 1
 *
 * Source: Standard chi-squared distribution tables
 */
const CRITICAL_VALUES = {
    1:  { 0.05: 3.841, 0.01: 6.635 },
    2:  { 0.05: 5.991, 0.01: 9.210 },
    3:  { 0.05: 7.815, 0.01: 11.345 },
    4:  { 0.05: 9.488, 0.01: 13.277 },
    5:  { 0.05: 11.070, 0.01: 15.086 },
    6:  { 0.05: 12.592, 0.01: 16.812 },
    7:  { 0.05: 14.067, 0.01: 18.475 },
    8:  { 0.05: 15.507, 0.01: 20.090 },
    9:  { 0.05: 16.919, 0.01: 21.666 },
    10: { 0.05: 18.307, 0.01: 23.209 },
    11: { 0.05: 19.675, 0.01: 24.725 },
    12: { 0.05: 21.026, 0.01: 26.217 },
    15: { 0.05: 24.996, 0.01: 30.578 },
    20: { 0.05: 31.410, 0.01: 37.566 },
};

/**
 * Perform a chi-squared goodness-of-fit test.
 *
 * Compares observed frequencies against expected frequencies and
 * determines whether the difference is statistically significant.
 *
 * @param {number[]} observed — Array of observed counts per category
 * @param {number[]} expected — Array of expected counts per category
 *                               (must be same length as observed)
 * @param {number} alpha — Significance level (0.01 = 99% confidence,
 *                          0.05 = 95% confidence). Default: 0.01
 * @returns {{
 *   chiSquared: number,    — The χ² test statistic
 *   df: number,            — Degrees of freedom
 *   criticalValue: number, — The threshold for rejection
 *   pass: boolean,         — True if observed matches expected (do NOT reject H0)
 *   details: Array         — Per-category breakdown
 * }}
 */
function chiSquaredTest(observed, expected, alpha = 0.01) {
    if (observed.length !== expected.length) {
        throw new Error(`Observed (${observed.length}) and expected (${expected.length}) must have same length`);
    }

    const n = observed.length;
    const df = n - 1;

    // Calculate the test statistic
    let chiSquared = 0;
    const details = [];

    for (let i = 0; i < n; i++) {
        const diff = observed[i] - expected[i];
        const contribution = (diff * diff) / expected[i];
        chiSquared += contribution;

        details.push({
            index: i,
            observed: observed[i],
            expected: expected[i],
            diff,
            percentDiff: ((diff / expected[i]) * 100).toFixed(2) + '%',
            contribution: contribution.toFixed(4),
        });
    }

    // Look up the critical value
    const criticalValue = CRITICAL_VALUES[df]?.[alpha];
    if (!criticalValue) {
        // Fallback: approximate using Wilson-Hilferty formula for large df
        // This shouldn't happen for our use case (df ≤ 9 typically)
        throw new Error(`No critical value for df=${df}, alpha=${alpha}. Add it to CRITICAL_VALUES.`);
    }

    // Pass = do NOT reject H0 (observed matches expected)
    // Fail = reject H0 (observed significantly differs from expected)
    const pass = chiSquared <= criticalValue;

    return {
        chiSquared: parseFloat(chiSquared.toFixed(4)),
        df,
        criticalValue,
        alpha,
        pass,
        details,
    };
}

/**
 * Calculate expected frequencies for a set of die roll ranges.
 *
 * Given range strings like ["1-4", "5-6", "7-10"] and a total number
 * of iterations, calculates how many hits each range should receive
 * if the die is fair.
 *
 * @param {string[]} ranges — Array of range strings
 * @param {number} iterations — Total number of rolls
 * @returns {number[]} Expected count for each range
 */
function calculateExpectedFrequencies(ranges, iterations) {
    return ranges.map(range => {
        let min, max;
        if (range.includes('-')) {
            [min, max] = range.split('-').map(Number);
        } else {
            min = max = Number(range);
        }
        // Width of the range / total die values * iterations
        const width = max - min + 1;
        return (width / 10) * iterations;
    });
}

module.exports = {
    chiSquaredTest,
    calculateExpectedFrequencies,
    CRITICAL_VALUES,
};

/**
 * RNG Quality Tests
 * ==================
 *
 * PRIORITY: LOW — Math.random() is well-tested in V8, but these tests
 * provide confidence that the dice rolling logic correctly transforms
 * Math.random() output into fair d10 results.
 *
 * Tests:
 *   1. Uniformity: Each d10 value (1-10) appears ~10% of the time
 *   2. Sequential correlation: Roll N doesn't predict roll N+1
 *   3. Runs test: Sequences of above/below median have expected behavior
 *
 * Test characteristics:
 *   - Statistical (random)
 *   - ~10 seconds for 1M rolls
 *   - Tests the actual Math.floor(Math.random() * 10) + 1 pattern
 */

describe('RNG Quality — d10 dice roll fairness', () => {
    const ROLLS = 1000000;
    const TOLERANCE = 0.01; // 1% tolerance for uniformity

    test(`Uniformity: Each d10 value appears within ${TOLERANCE * 100}% of expected (${ROLLS.toLocaleString()} rolls)`, () => {
        const counts = new Array(10).fill(0);
        const expectedPerValue = ROLLS / 10;

        // Roll 1M d10s using the same formula as makeDebugRoll()
        for (let i = 0; i < ROLLS; i++) {
            const roll = Math.floor(Math.random() * 10) + 1;
            counts[roll - 1]++;
        }

        // Check each value is within tolerance
        const failures = [];
        for (let v = 1; v <= 10; v++) {
            const count = counts[v - 1];
            const deviation = Math.abs(count - expectedPerValue) / expectedPerValue;
            if (deviation > TOLERANCE) {
                failures.push({
                    value: v,
                    count,
                    expected: expectedPerValue,
                    deviation: (deviation * 100).toFixed(3) + '%',
                });
            }
        }

        if (failures.length > 0) {
            const report = failures.map(f =>
                `  d10=${f.value}: count=${f.count}, expected=${f.expected}, deviation=${f.deviation}`
            ).join('\n');
            throw new Error(`${failures.length} d10 values outside ${TOLERANCE * 100}% tolerance:\n${report}`);
        }

        // Log summary
        console.log('d10 uniformity test passed:');
        for (let v = 1; v <= 10; v++) {
            const pct = ((counts[v - 1] / ROLLS) * 100).toFixed(2);
            console.log(`  d10=${v}: ${counts[v - 1].toLocaleString()} (${pct}%)`);
        }
    });

    test('Sequential correlation: Roll N does not predict roll N+1', () => {
        const SAMPLE = 100000;
        const rolls = [];

        for (let i = 0; i < SAMPLE; i++) {
            rolls.push(Math.floor(Math.random() * 10) + 1);
        }

        // Count how often consecutive rolls match (same value)
        let matches = 0;
        for (let i = 1; i < rolls.length; i++) {
            if (rolls[i] === rolls[i - 1]) matches++;
        }

        // Expected match rate for independent d10 rolls: 1/10 = 10%
        const matchRate = matches / (SAMPLE - 1);
        const expectedRate = 0.1;
        const deviation = Math.abs(matchRate - expectedRate);

        console.log(`Sequential match rate: ${(matchRate * 100).toFixed(2)}% (expected: ${expectedRate * 100}%)`);

        // Allow 1% deviation from expected rate
        expect(deviation).toBeLessThan(0.01);
    });

    test('Runs test: Above/below median sequences have expected count', () => {
        const SAMPLE = 100000;
        const median = 5.5; // d10 median (between 5 and 6)
        const rolls = [];

        for (let i = 0; i < SAMPLE; i++) {
            rolls.push(Math.floor(Math.random() * 10) + 1);
        }

        // Count runs: a "run" is a maximal sequence of consecutive rolls
        // all above or all below the median
        let runs = 1;
        for (let i = 1; i < rolls.length; i++) {
            const prevAbove = rolls[i - 1] > median;
            const currAbove = rolls[i] > median;
            if (prevAbove !== currAbove) runs++;
        }

        // For a fair RNG, the expected number of runs is approximately:
        // E(runs) = (2 * n_above * n_below) / n + 1
        const nAbove = rolls.filter(r => r > median).length;
        const nBelow = SAMPLE - nAbove;
        const expectedRuns = (2 * nAbove * nBelow) / SAMPLE + 1;

        const deviation = Math.abs(runs - expectedRuns) / expectedRuns;

        console.log(`Runs: ${runs}, Expected: ${Math.round(expectedRuns)}, Deviation: ${(deviation * 100).toFixed(2)}%`);

        // Allow 2% deviation (runs test has higher variance than uniformity)
        expect(deviation).toBeLessThan(0.02);
    });
});

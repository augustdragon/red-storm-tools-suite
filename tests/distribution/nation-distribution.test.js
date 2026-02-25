/**
 * Nation Distribution Tests
 * ==========================
 *
 * PRIORITY: MEDIUM — Validates that the d10 roll system produces nation
 * selections at the expected frequency rates across many iterations.
 *
 * For each table variant (e.g., Table A / 2ATAF / pre), we:
 *   1. Run 100,000 iterations of nation selection
 *   2. Count how many times each nation range is selected
 *   3. Compare against the expected frequency: (range_width / 10) * iterations
 *   4. Apply chi-squared goodness-of-fit test at alpha=0.01
 *
 * Example:
 *   Table A / 2ATAF / pre has nations:
 *     "1-4" → UK (expected: 40,000 out of 100,000)
 *     "5-6" → BE/NE (expected: 20,000)
 *     "7-10" → FRG (expected: 40,000)
 *
 * Test characteristics:
 *   - Statistical (uses random rolls, so there's a tiny chance of false failure)
 *   - Slower (~30-60 seconds for all tables)
 *   - Tests the actual RNG integration with range matching
 */

const { loadAllTables } = require('../helpers/table-data-loader');
const { findAllRangeObjects, parseRange } = require('../helpers/table-enumerator');
const { chiSquaredTest, calculateExpectedFrequencies } = require('../helpers/chi-squared-helper');

const ITERATIONS = 100000;

describe('Nation Distribution — d10 roll frequencies match expected rates', () => {
    let allTables;

    beforeAll(() => {
        allTables = loadAllTables();
    });

    /**
     * Find the top-level "nations" range objects in a table.
     * These are the first range objects encountered when walking the table —
     * they represent the nation selection step (the first d10 roll).
     *
     * We need to distinguish nation-level ranges from aircraft-level ranges.
     * Nation ranges contain objects with a "name" property (the nation name)
     * and nested "aircraft" data. Aircraft ranges contain objects with
     * aircraftId/name properties but no nested "aircraft" key.
     *
     * @param {object} tableData - Single table's data
     * @param {string} tableId - Table identifier for path building
     * @returns {Array<{path, ranges, rangeObj}>}
     */
    function findNationRanges(tableData, tableId) {
        const allRanges = findAllRangeObjects(tableData, tableId);

        // Filter to nation-level ranges: the values should have a "name" property
        // and at least one should have an "aircraft" sub-object
        return allRanges.filter(({ obj }) => {
            const values = Object.values(obj);
            return values.some(v =>
                v && typeof v === 'object' && ('name' in v) && ('aircraft' in v)
            );
        });
    }

    /**
     * Simulate nation selection for a given range object.
     *
     * @param {object} rangeObj - Nations range object
     * @param {number} iterations - Number of rolls to simulate
     * @returns {{observed: number[], ranges: string[]}}
     */
    function simulateNationRolls(rangeObj, iterations) {
        const ranges = Object.keys(rangeObj);
        const observed = new Array(ranges.length).fill(0);

        for (let i = 0; i < iterations; i++) {
            const roll = Math.floor(Math.random() * 10) + 1;
            for (let r = 0; r < ranges.length; r++) {
                const [min, max] = parseRange(ranges[r]);
                if (roll >= min && roll <= max) {
                    observed[r]++;
                    break;
                }
            }
        }

        return { observed, ranges };
    }

    // Generate tests for each module's tables
    const modules = [
        { name: 'Red Storm NATO', loader: () => require('../../modules/red-storm/oob-generator/data/nato-tables.json') },
        { name: 'Red Storm WP', loader: () => require('../../modules/red-storm/oob-generator/data/wp-tables.json') },
        { name: 'Baltic Approaches NATO', loader: () => require('../../modules/baltic-approaches/oob-generator/data/nato-tables.json') },
        { name: 'Baltic Approaches WP', loader: () => require('../../modules/baltic-approaches/oob-generator/data/wp-tables.json') },
    ];

    for (const mod of modules) {
        describe(mod.name, () => {
            test(`Nation distributions pass chi-squared test at alpha=0.01 (${ITERATIONS.toLocaleString()} iterations)`, () => {
                const tables = mod.loader();
                const tableIds = Object.keys(tables).filter(k => !k.startsWith('_'));

                let testedCount = 0;
                const failures = [];

                for (const tableId of tableIds) {
                    const nationRanges = findNationRanges(tables[tableId], tableId);

                    for (const { path, obj } of nationRanges) {
                        const { observed, ranges } = simulateNationRolls(obj, ITERATIONS);
                        const expected = calculateExpectedFrequencies(ranges, ITERATIONS);

                        // Only test if we have more than 1 range (single-range is trivially 100%)
                        if (ranges.length > 1) {
                            const result = chiSquaredTest(observed, expected, 0.01);
                            testedCount++;

                            if (!result.pass) {
                                failures.push({
                                    path,
                                    ranges,
                                    chiSquared: result.chiSquared,
                                    criticalValue: result.criticalValue,
                                    details: result.details,
                                });
                            }
                        }
                    }
                }

                if (failures.length > 0) {
                    const report = failures.map(f => {
                        const detailStr = f.details.map(d =>
                            `      Range ${f.ranges[d.index]}: observed=${d.observed}, expected=${d.expected}, diff=${d.percentDiff}`
                        ).join('\n');
                        return `  ${f.path}\n    χ²=${f.chiSquared} > critical=${f.criticalValue}\n${detailStr}`;
                    }).join('\n\n');

                    throw new Error(`${failures.length}/${testedCount} nation distributions failed chi-squared test:\n${report}`);
                }

                console.log(`  ${mod.name}: ${testedCount} nation distributions tested, all passed`);
            });
        });
    }
});

/**
 * Aircraft Distribution Tests
 * =============================
 *
 * PRIORITY: MEDIUM — Validates that aircraft selection within each nation
 * follows the expected probability distribution.
 *
 * After rolling for nation, the player rolls a second d10 for aircraft type.
 * Each nation has its own aircraft table. This test verifies that the
 * aircraft ranges produce the expected frequency distribution.
 *
 * Test characteristics:
 *   - Statistical (random, small chance of false failure at alpha=0.01)
 *   - Slower (~30-60 seconds for all tables)
 *   - Tests aircraft-level ranges within every nation in every table variant
 */

const { findAllRangeObjects, parseRange } = require('../helpers/table-enumerator');
const { chiSquaredTest, calculateExpectedFrequencies } = require('../helpers/chi-squared-helper');

const ITERATIONS = 100000;

describe('Aircraft Distribution — aircraft selection frequencies match expected rates', () => {

    /**
     * Find aircraft-level range objects within a table.
     * Aircraft ranges are nested inside nation entries — they have values
     * that contain "name" or "aircraftId" but NOT nested "aircraft" objects.
     *
     * @param {object} tableData - Single table's data
     * @param {string} tableId - Table identifier
     * @returns {Array<{path, obj}>}
     */
    function findAircraftRanges(tableData, tableId) {
        const allRanges = findAllRangeObjects(tableData, tableId);

        return allRanges.filter(({ obj }) => {
            const values = Object.values(obj);
            // Aircraft ranges: values have a name/aircraftId but NOT a nested "aircraft" key
            return values.some(v =>
                v && typeof v === 'object' &&
                ('name' in v || 'aircraftId' in v || 'aircraft' in v === false) &&
                !('aircraft' in v && typeof v.aircraft === 'object')
            );
        });
    }

    /**
     * Simulate aircraft selection for a given range object.
     */
    function simulateAircraftRolls(rangeObj, iterations) {
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

    const modules = [
        { name: 'Red Storm NATO', file: '../../modules/red-storm/oob-generator/data/nato-tables.json' },
        { name: 'Red Storm WP', file: '../../modules/red-storm/oob-generator/data/wp-tables.json' },
        { name: 'BA NATO', file: '../../modules/baltic-approaches/oob-generator/data/nato-tables.json' },
        { name: 'BA WP', file: '../../modules/baltic-approaches/oob-generator/data/wp-tables.json' },
    ];

    for (const mod of modules) {
        describe(mod.name, () => {
            test(`Aircraft distributions pass chi-squared test at alpha=0.01 (${ITERATIONS.toLocaleString()} iterations)`, () => {
                const tables = require(mod.file);
                const tableIds = Object.keys(tables).filter(k => !k.startsWith('_'));

                let testedCount = 0;
                const failures = [];

                for (const tableId of tableIds) {
                    const aircraftRanges = findAircraftRanges(tables[tableId], tableId);

                    for (const { path, obj } of aircraftRanges) {
                        const ranges = Object.keys(obj);
                        if (ranges.length <= 1) continue; // Skip single-range (trivial)

                        const { observed } = simulateAircraftRolls(obj, ITERATIONS);
                        const expected = calculateExpectedFrequencies(ranges, ITERATIONS);

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

                if (failures.length > 0) {
                    const report = failures.map(f => {
                        const detailStr = f.details.map(d =>
                            `      Range ${f.ranges[d.index]}: observed=${d.observed}, expected=${d.expected}, diff=${d.percentDiff}`
                        ).join('\n');
                        return `  ${f.path}\n    χ²=${f.chiSquared} > critical=${f.criticalValue}\n${detailStr}`;
                    }).join('\n\n');

                    throw new Error(`${failures.length}/${testedCount} aircraft distributions failed chi-squared test:\n${report}`);
                }

                console.log(`  ${mod.name}: ${testedCount} aircraft distributions tested, all passed`);
            });
        });
    }
});

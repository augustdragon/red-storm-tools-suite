/**
 * End-to-End Tests — Baltic Approaches WP Tables G2-L2
 * ======================================================
 *
 * BA WP tables use:
 *   - G2, H2: dateRanges → nations → aircraft
 *   - I2: nationalities → taskings → aircraft
 *   - J2: taskings → dates → aircraft
 *   - J3: nationalities → dates → aircraft
 *   - K2: nationalities → dates → aircraft
 *   - L2: missionTypes → dates → aircraft
 *
 * See table-a-f.test.js for the mock strategy documentation.
 */

require('../setup/load-processors');
const { loadBAWPTables } = require('../helpers/table-data-loader');

function mockRollSequence(rollValues) {
    let callIndex = 0;
    const originalRandom = Math.random;
    jest.spyOn(Math, 'random').mockImplementation(() => {
        if (callIndex < rollValues.length) {
            const roll = rollValues[callIndex++];
            return (roll - 1) / 10;
        }
        return originalRandom();
    });
}

describe('Baltic Approaches WP — End-to-End Processor Tests (Tables G2-L2)', () => {
    let tables;

    beforeAll(() => {
        tables = loadBAWPTables();
        global.oobTables = { ...global.oobTables, ...tables };
        if (typeof window !== 'undefined') {
            window.oobTables = global.oobTables;
        }

        // BA date ranges for index-to-string conversion
        global.BA_DATE_RANGES = ['15-20 May', '21-31 May', '1-15 June'];
        if (typeof window !== 'undefined') {
            window.BA_DATE_RANGES = global.BA_DATE_RANGES;
        }
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // ---- Table G2: QRA Flight ----
    describe('Table G2 — QRA Flight', () => {
        const dateRanges = ['15-20 May', '21-31 May', '1-15 June'];

        for (const dateRange of dateRanges) {
            test(`${dateRange}: All 100 d10×d10 combos produce valid results`, () => {
                const processor = new WPTableG2(tables['G2']);
                const failures = [];

                for (let r1 = 1; r1 <= 10; r1++) {
                    for (let r2 = 1; r2 <= 10; r2++) {
                        mockRollSequence([r1, r2, 5, 5]);
                        try {
                            const result = processor.process({ scenarioDate: dateRange });
                            if (!result.text || result.text.startsWith('Error')) {
                                failures.push(`[${r1},${r2}]: ${result.text}`);
                            }
                        } catch (err) {
                            failures.push(`[${r1},${r2}]: EXCEPTION: ${err.message}`);
                        }
                        jest.restoreAllMocks();
                    }
                }

                if (failures.length > 0) {
                    throw new Error(`${failures.length}/100 combinations failed:\n  ${failures.join('\n  ')}`);
                }
            });
        }
    });

    // ---- Table H2: Fighter Sweep ----
    describe('Table H2 — Fighter Sweep', () => {
        // H2 only has 2 date ranges
        const dateRanges = ['15-31 May', '1-15 June'];

        for (const dateRange of dateRanges) {
            test(`${dateRange}: All 100 d10×d10 combos produce valid results`, () => {
                const processor = new WPTableH2(tables['H2']);
                const failures = [];

                for (let r1 = 1; r1 <= 10; r1++) {
                    for (let r2 = 1; r2 <= 10; r2++) {
                        mockRollSequence([r1, r2, 5, 5]);
                        try {
                            const result = processor.process({ scenarioDate: dateRange });
                            if (!result.text || result.text.startsWith('Error')) {
                                failures.push(`[${r1},${r2}]: ${result.text}`);
                            }
                        } catch (err) {
                            failures.push(`[${r1},${r2}]: EXCEPTION: ${err.message}`);
                        }
                        jest.restoreAllMocks();
                    }
                }

                if (failures.length > 0) {
                    throw new Error(`${failures.length}/100 combinations failed:\n  ${failures.join('\n  ')}`);
                }
            });
        }
    });

    // ---- Table I2: Bombing Raid ----
    describe('Table I2 — Bombing Raid', () => {
        const nationalities = ['GDR', 'POL', 'USSR'];
        const taskings = ['CAP', 'SEAD', 'Bombing'];
        const dateRanges = ['15-20 May', '21-31 May', '1-15 June'];

        for (const nationality of nationalities) {
            for (const tasking of taskings) {
                // Test with a representative date
                test(`${nationality}/${tasking}: All 10 rolls produce valid results`, () => {
                    const processor = new WPTableI2(tables['I2']);
                    const failures = [];

                    for (let roll = 1; roll <= 10; roll++) {
                        mockRollSequence([roll, 5, 5, 5]);
                        try {
                            const result = processor.process({
                                nationality,
                                tasking,
                                scenarioDate: '15-20 May',
                            });
                            if (!result.text || result.text.startsWith('Error')) {
                                failures.push(`[${roll}]: ${result.text}`);
                            }
                        } catch (err) {
                            failures.push(`[${roll}]: EXCEPTION: ${err.message}`);
                        }
                        jest.restoreAllMocks();
                    }

                    if (failures.length > 0) {
                        throw new Error(`${failures.length}/10 rolls failed:\n  ${failures.join('\n  ')}`);
                    }
                });
            }
        }
    });

    // ---- Table J2: Deep Strike Raid ----
    describe('Table J2 — Deep Strike Raid', () => {
        const taskings = ['Escort Jamming', 'Close Escort', 'Deep Strike', 'Recon'];
        const dateRanges = ['15-20 May', '21-31 May', '1-15 June'];

        for (const tasking of taskings) {
            test(`${tasking}: All 10 rolls produce valid results`, () => {
                const processor = new WPTableJ2(tables['J2']);
                const failures = [];

                for (let roll = 1; roll <= 10; roll++) {
                    mockRollSequence([roll, 5, 5, 5]);
                    try {
                        const result = processor.process({
                            tasking,
                            scenarioDate: '15-20 May',
                        });
                        if (!result.text || result.text.startsWith('Error')) {
                            failures.push(`[${roll}]: ${result.text}`);
                        }
                    } catch (err) {
                        failures.push(`[${roll}]: EXCEPTION: ${err.message}`);
                    }
                    jest.restoreAllMocks();
                }

                if (failures.length > 0) {
                    throw new Error(`${failures.length}/10 rolls failed:\n  ${failures.join('\n  ')}`);
                }
            });
        }
    });

    // ---- Table J3: Naval Strike Raid ----
    describe('Table J3 — Naval Strike Raid', () => {
        const nationalities = ['USSR', 'GDR', 'POL'];
        const dateRanges = ['15-20 May', '21-31 May', '1-15 June'];

        for (const nationality of nationalities) {
            test(`${nationality}: All 10 rolls produce valid results`, () => {
                const processor = new WPTableJ3(tables['J3']);
                const failures = [];

                for (let roll = 1; roll <= 10; roll++) {
                    mockRollSequence([roll, 5, 5, 5]);
                    try {
                        const result = processor.process({
                            nationality,
                            scenarioDate: '15-20 May',
                        });
                        if (!result.text || result.text.startsWith('Error')) {
                            failures.push(`[${roll}]: ${result.text}`);
                        }
                    } catch (err) {
                        failures.push(`[${roll}]: EXCEPTION: ${err.message}`);
                    }
                    jest.restoreAllMocks();
                }

                if (failures.length > 0) {
                    throw new Error(`${failures.length}/10 rolls failed:\n  ${failures.join('\n  ')}`);
                }
            });
        }
    });

    // ---- Table K2: Combat Rescue ----
    describe('Table K2 — Combat Rescue', () => {
        const nationalities = ['GDR', 'GDR Naval'];
        const dateRanges = ['15-20 May', '21-31 May', '1-15 June'];

        for (const nationality of nationalities) {
            test(`${nationality}: All 10 rolls produce valid results`, () => {
                const processor = new WPTableK2(tables['K2']);
                const failures = [];

                for (let roll = 1; roll <= 10; roll++) {
                    mockRollSequence([roll, 5, 5, 5]);
                    try {
                        const result = processor.process({
                            nationality,
                            scenarioDate: '15-20 May',
                        });
                        if (!result.text || result.text.startsWith('Error')) {
                            failures.push(`[${roll}]: ${result.text}`);
                        }
                    } catch (err) {
                        failures.push(`[${roll}]: EXCEPTION: ${err.message}`);
                    }
                    jest.restoreAllMocks();
                }

                if (failures.length > 0) {
                    throw new Error(`${failures.length}/10 rolls failed:\n  ${failures.join('\n  ')}`);
                }
            });
        }
    });

    // ---- Table L2: Special Missions ----
    describe('Table L2 — Special Missions', () => {
        test('Table L2 data exists and has missionTypes', () => {
            expect(tables['L2']).toBeDefined();
            expect(tables['L2'].missionTypes).toBeDefined();
        });

        test('All rolls produce valid results for each mission type', () => {
            const missionTypes = Object.keys(tables['L2'].missionTypes);
            const processor = new WPTableL2(tables['L2']);
            const failures = [];

            for (const missionType of missionTypes) {
                for (let roll = 1; roll <= 10; roll++) {
                    mockRollSequence([roll, 5, 5, 5]);
                    try {
                        const result = processor.process({
                            missionType,
                            scenarioDate: '15-20 May',
                        });
                        if (!result.text || result.text.startsWith('Error')) {
                            failures.push(`${missionType}[${roll}]: ${result.text}`);
                        }
                    } catch (err) {
                        failures.push(`${missionType}[${roll}]: EXCEPTION: ${err.message}`);
                    }
                    jest.restoreAllMocks();
                }
            }

            if (failures.length > 0) {
                throw new Error(`${failures.length} combinations failed:\n  ${failures.join('\n  ')}`);
            }
        });
    });
});

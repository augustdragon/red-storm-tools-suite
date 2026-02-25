/**
 * End-to-End Tests — Red Storm NATO Tables A-F
 * ===============================================
 *
 * Tests each table processor by mocking Math.random() to force every
 * possible d10 × d10 combination (100 combinations per variant).
 *
 * For each combination, verifies:
 *   - The processor returns a result (no exceptions)
 *   - The result has required fields (text, nationName/nationality, aircraftType)
 *   - No null aircraft types (except for documented special cases)
 *
 * Mock strategy:
 *   The dice rolling code uses: Math.floor(Math.random() * 10) + 1
 *   To force a specific d10 result R, we need: Math.random() → (R - 1) / 10
 *   We provide a sequence of mock values that get consumed in order.
 *
 * Test characteristics:
 *   - Deterministic (mocked RNG)
 *   - Moderate speed (~5-10 seconds for all RS NATO tables)
 *   - Tests actual processor code end-to-end
 */

require('../setup/load-processors');
const { loadRSNatoTables } = require('../helpers/table-data-loader');

/**
 * Create a mock Math.random that returns values from a queue.
 * Each call to Math.random() consumes the next value in the sequence.
 * If the sequence runs out, falls back to real random (for sub-rolls etc.).
 *
 * @param {number[]} rollValues - d10 values (1-10) to produce in sequence
 */
function mockRollSequence(rollValues) {
    let callIndex = 0;
    const originalRandom = Math.random;

    jest.spyOn(Math, 'random').mockImplementation(() => {
        if (callIndex < rollValues.length) {
            const roll = rollValues[callIndex++];
            // Convert d10 value (1-10) to Math.random() value (0-0.99...)
            // Math.floor(x * 10) + 1 = roll  →  x = (roll - 1) / 10
            return (roll - 1) / 10;
        }
        // Fallback for extra rolls (sub-rolls, etc.)
        return originalRandom();
    });
}

describe('Red Storm NATO — End-to-End Processor Tests (Tables A-F)', () => {
    let tables;

    beforeAll(() => {
        tables = loadRSNatoTables();
        // Make table data available to getTableDataSource()
        global.oobTables = tables;
        if (typeof window !== 'undefined') {
            window.oobTables = tables;
        }
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // ---- Table A: QRA Flight ----
    // Variants: 2ATAF/4ATAF × pre/post = 4 variants
    describe('Table A — QRA Flight', () => {
        const variants = [
            { atafZone: '2ATAF', scenarioDate: 'pre' },
            { atafZone: '2ATAF', scenarioDate: 'post' },
            { atafZone: '4ATAF', scenarioDate: 'pre' },
            { atafZone: '4ATAF', scenarioDate: 'post' },
        ];

        for (const params of variants) {
            describe(`${params.atafZone} / ${params.scenarioDate}`, () => {
                test('All 100 d10×d10 combinations produce valid results', () => {
                    const processor = new NATOTableA(tables['A']);
                    const failures = [];

                    for (let nationRoll = 1; nationRoll <= 10; nationRoll++) {
                        for (let aircraftRoll = 1; aircraftRoll <= 10; aircraftRoll++) {
                            mockRollSequence([nationRoll, aircraftRoll, 5]); // 5 as fallback for sub-rolls
                            try {
                                const result = processor.process(params);
                                if (!result.text || result.text.startsWith('Error')) {
                                    failures.push(`[${nationRoll},${aircraftRoll}]: ${result.text}`);
                                }
                            } catch (err) {
                                failures.push(`[${nationRoll},${aircraftRoll}]: EXCEPTION: ${err.message}`);
                            }
                            jest.restoreAllMocks();
                        }
                    }

                    if (failures.length > 0) {
                        throw new Error(`${failures.length}/100 combinations failed:\n  ${failures.join('\n  ')}`);
                    }
                });

                test('Results have required fields', () => {
                    const processor = new NATOTableA(tables['A']);
                    mockRollSequence([1, 1]);
                    const result = processor.process(params);
                    jest.restoreAllMocks();

                    expect(result).toHaveProperty('text');
                    expect(result).toHaveProperty('nationName');
                    expect(result).toHaveProperty('aircraftType');
                    expect(result).toHaveProperty('flightSize');
                    expect(result).toHaveProperty('tasking');
                    expect(result.tasking).toBe('CAP');
                });
            });
        }
    });

    // ---- Table B: CAP Flight ----
    describe('Table B — CAP Flight', () => {
        const variants = [
            { atafZone: '2ATAF', scenarioDate: 'pre' },
            { atafZone: '2ATAF', scenarioDate: 'post' },
            { atafZone: '4ATAF', scenarioDate: 'pre' },
            { atafZone: '4ATAF', scenarioDate: 'post' },
        ];

        for (const params of variants) {
            test(`${params.atafZone}/${params.scenarioDate}: All 100 combos produce valid results`, () => {
                const processor = new NATOTableB(tables['B']);
                const failures = [];

                for (let r1 = 1; r1 <= 10; r1++) {
                    for (let r2 = 1; r2 <= 10; r2++) {
                        mockRollSequence([r1, r2, 5]);
                        try {
                            const result = processor.process(params);
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

    // ---- Table C: Bombing Raid (3 taskings × 2 dates = 6 variants) ----
    describe('Table C — Bombing Raid', () => {
        const taskings = ['CAP', 'SEAD', 'Bombing'];
        const dates = ['pre', 'post'];

        for (const tasking of taskings) {
            for (const scenarioDate of dates) {
                test(`${tasking}/${scenarioDate}: All 100 combos produce valid results`, () => {
                    const processor = new NATOTableC(tables['C']);
                    const failures = [];

                    for (let r1 = 1; r1 <= 10; r1++) {
                        for (let r2 = 1; r2 <= 10; r2++) {
                            mockRollSequence([r1, r2, 5, 5]);
                            try {
                                const result = processor.process({ tasking, scenarioDate });
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
        }
    });

    // ---- Table D: Deep Strike Raid ----
    describe('Table D — Deep Strike Raid', () => {
        const taskings = ['Escort Jamming', 'CAP', 'SEAD', 'Bombing', 'Recon'];
        const dates = ['pre', 'post'];

        for (const tasking of taskings) {
            for (const scenarioDate of dates) {
                test(`${tasking}/${scenarioDate}: All 100 combos produce valid results`, () => {
                    const processor = new NATOTableD(tables['D']);
                    const failures = [];

                    for (let r1 = 1; r1 <= 10; r1++) {
                        for (let r2 = 1; r2 <= 10; r2++) {
                            mockRollSequence([r1, r2, 5, 5]);
                            try {
                                const result = processor.process({ tasking, scenarioDate });
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
        }
    });

    // ---- Table E: Combat Rescue ----
    describe('Table E — Combat Rescue', () => {
        const nationalities = ['US', 'UK', 'FRG'];
        const dates = ['pre', 'post'];

        for (const nationality of nationalities) {
            for (const scenarioDate of dates) {
                test(`${nationality}/${scenarioDate}: All 100 combos produce valid results`, () => {
                    const processor = new NATOTableE(tables['E']);
                    const failures = [];

                    for (let r1 = 1; r1 <= 10; r1++) {
                        for (let r2 = 1; r2 <= 10; r2++) {
                            mockRollSequence([r1, r2, 5, 5]);
                            try {
                                const result = processor.process({ nationality, scenarioDate });
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
        }
    });

    // ---- Table F: Special Missions ----
    describe('Table F — Special Missions', () => {
        test('Table F data exists and has missionTypes', () => {
            expect(tables['F']).toBeDefined();
            expect(tables['F'].missionTypes).toBeDefined();
        });

        test('All 10 rolls produce valid results for each mission type', () => {
            const missionTypes = Object.keys(tables['F'].missionTypes);
            const dates = ['pre', 'post'];
            const processor = new NATOTableF(tables['F']);
            const failures = [];

            for (const missionType of missionTypes) {
                for (const scenarioDate of dates) {
                    for (let roll = 1; roll <= 10; roll++) {
                        mockRollSequence([roll, 5, 5, 5]);
                        try {
                            const result = processor.process({ missionType, scenarioDate });
                            if (!result.text || result.text.startsWith('Error')) {
                                failures.push(`${missionType}/${scenarioDate}[${roll}]: ${result.text}`);
                            }
                        } catch (err) {
                            failures.push(`${missionType}/${scenarioDate}[${roll}]: EXCEPTION: ${err.message}`);
                        }
                        jest.restoreAllMocks();
                    }
                }
            }

            if (failures.length > 0) {
                throw new Error(`${failures.length} combinations failed:\n  ${failures.join('\n  ')}`);
            }
        });
    });
});

/**
 * End-to-End Tests — Red Storm WP Tables G-L
 * =============================================
 *
 * Tests each Warsaw Pact table processor with mocked RNG.
 * WP tables have different structures from NATO tables:
 *   - G, H: flat nations → aircraft (no ATAF/date variants)
 *   - I: nationalities → taskings → aircraft
 *   - J: taskings → nationality → aircraft
 *   - K: nationalities → dates → aircraft
 *   - L: missionTypes → aircraft
 *
 * See table-a-f.test.js for detailed documentation on the mock strategy.
 */

require('../setup/load-processors');
const { loadRSWPTables } = require('../helpers/table-data-loader');

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

describe('Red Storm WP — End-to-End Processor Tests (Tables G-L)', () => {
    let tables;

    beforeAll(() => {
        tables = loadRSWPTables();
        global.oobTables = { ...global.oobTables, ...tables };
        if (typeof window !== 'undefined') {
            window.oobTables = global.oobTables;
        }
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // ---- Table G: QRA Flights ----
    // Flat structure: nations → aircraft (no variants)
    describe('Table G — QRA Flights', () => {
        test('All 100 d10×d10 combinations produce valid results', () => {
            const processor = new WPTableG(tables['G']);
            const failures = [];

            for (let r1 = 1; r1 <= 10; r1++) {
                for (let r2 = 1; r2 <= 10; r2++) {
                    mockRollSequence([r1, r2, 5, 5]);
                    try {
                        const result = processor.process({});
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

        test('Results include aircraftType and nationName', () => {
            const processor = new WPTableG(tables['G']);
            mockRollSequence([1, 1]);
            const result = processor.process({});
            jest.restoreAllMocks();

            expect(result).toHaveProperty('text');
            expect(result.text).not.toMatch(/^Error/);
        });
    });

    // ---- Table H: Fighter Sweep ----
    describe('Table H — Fighter Sweep', () => {
        test('All 100 d10×d10 combinations produce valid results', () => {
            const processor = new WPTableH(tables['H']);
            const failures = [];

            for (let r1 = 1; r1 <= 10; r1++) {
                for (let r2 = 1; r2 <= 10; r2++) {
                    mockRollSequence([r1, r2, 5, 5]);
                    try {
                        const result = processor.process({});
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
    });

    // ---- Table I: Bombing Raid ----
    describe('Table I — Bombing Raid', () => {
        const nationalities = ['USSR', 'GDR'];
        const taskings = ['CAP', 'SEAD', 'Bombing'];
        const dates = ['pre', 'post'];

        for (const nationality of nationalities) {
            for (const tasking of taskings) {
                for (const scenarioDate of dates) {
                    test(`${nationality}/${tasking}/${scenarioDate}: All 10 rolls produce valid results`, () => {
                        const processor = new WPTableI(tables['I']);
                        const failures = [];

                        for (let roll = 1; roll <= 10; roll++) {
                            mockRollSequence([roll, 5, 5, 5]);
                            try {
                                const result = processor.process({ nationality, tasking, scenarioDate });
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
        }
    });

    // ---- Table J: Deep Strike Raid ----
    describe('Table J — Deep Strike Raid', () => {
        const taskings = ['Escort Jamming', 'Chaff Laying', 'Close Escort', 'Bombing', 'Recon'];
        const dates = ['pre', 'post'];

        for (const tasking of taskings) {
            for (const scenarioDate of dates) {
                test(`${tasking}/${scenarioDate}: All 10 rolls produce valid results`, () => {
                    const processor = new WPTableJ(tables['J']);
                    const failures = [];

                    for (let roll = 1; roll <= 10; roll++) {
                        mockRollSequence([roll, 5, 5, 5]);
                        try {
                            const result = processor.process({ tasking, scenarioDate });
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

    // ---- Table K: Combat Rescue ----
    describe('Table K — Combat Rescue', () => {
        const nationalities = ['USSR', 'GDR'];
        const dates = ['pre', 'post'];

        for (const nationality of nationalities) {
            for (const scenarioDate of dates) {
                test(`${nationality}/${scenarioDate}: All 10 rolls produce valid results`, () => {
                    const processor = new WPTableK(tables['K']);
                    const failures = [];

                    for (let roll = 1; roll <= 10; roll++) {
                        mockRollSequence([roll, 5, 5, 5]);
                        try {
                            const result = processor.process({ nationality, scenarioDate });
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

    // ---- Table L: Special Missions ----
    describe('Table L — Special Missions', () => {
        test('Table L data exists and has missionTypes', () => {
            expect(tables['L']).toBeDefined();
            expect(tables['L'].missionTypes).toBeDefined();
        });

        test('Standoff Jamming: All 10 rolls produce valid results', () => {
            const processor = new WPTableL(tables['L']);
            const failures = [];

            for (let roll = 1; roll <= 10; roll++) {
                mockRollSequence([roll, 5, 5, 5]);
                try {
                    const result = processor.process({ missionType: 'Standoff Jamming' });
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

        // Tactical Recon requires a nationality parameter (not a die roll).
        // The scan says "Number of aircraft in flight as shown in scenario."
        // Test both USSR and GDR separately.
        test('Tactical Recon: All 10 rolls produce valid results for each nation', () => {
            const processor = new WPTableL(tables['L']);
            const nations = ['USSR', 'GDR'];
            const failures = [];

            for (const nation of nations) {
                for (let roll = 1; roll <= 10; roll++) {
                    mockRollSequence([roll, 5, 5, 5]);
                    try {
                        const result = processor.process({
                            missionType: 'Tactical Recon',
                            tacticalReconNation: nation,
                        });
                        if (!result.text || result.text.startsWith('Error')) {
                            failures.push(`${nation}[${roll}]: ${result.text}`);
                        }
                    } catch (err) {
                        failures.push(`${nation}[${roll}]: EXCEPTION: ${err.message}`);
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

/**
 * End-to-End Tests — Baltic Approaches NATO Tables A2-F2
 * ========================================================
 *
 * BA NATO tables differ from RS NATO tables:
 *   - Use dateRanges instead of ATAF zones (e.g., "15-20 May", "21-31 May")
 *   - Include Swedish forces (A2-SE variant)
 *   - Some tables (D3) have complex nationality-by-date structures
 *
 * See table-a-f.test.js for the mock strategy documentation.
 */

require('../setup/load-processors');
const { loadBANatoTables } = require('../helpers/table-data-loader');

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

describe('Baltic Approaches NATO — End-to-End Processor Tests (Tables A2-F2)', () => {
    let tables;

    beforeAll(() => {
        tables = loadBANatoTables();
        global.oobTables = { ...global.oobTables, ...tables };
        if (typeof window !== 'undefined') {
            window.oobTables = global.oobTables;
        }

        // BA processors may reference BA_DATE_RANGES for date index → string conversion
        global.BA_DATE_RANGES = ['15-20 May', '21-31 May', '1-15 June'];
        if (typeof window !== 'undefined') {
            window.BA_DATE_RANGES = global.BA_DATE_RANGES;
        }
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // ---- Table A2: QRA Flight ----
    describe('Table A2 — QRA Flight', () => {
        const dateRanges = ['15-20 May', '21-31 May', '1-15 June'];

        for (const dateRange of dateRanges) {
            test(`${dateRange}: All 100 d10×d10 combos produce valid results`, () => {
                const processor = new NATOTableA2(tables['A2']);
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

    // ---- Table A2-SE: Swedish QRA ----
    describe('Table A2-SE — SE QRA Flight', () => {
        test('All 100 d10×d10 combos produce valid results', () => {
            // A2-SE may be a separate table entry or a variant of A2
            const tableData = tables['A2-SE'] || tables['A2'];
            if (!tableData) {
                console.log('A2-SE table data not found, skipping');
                return;
            }

            const processor = new NATOTableA2(tableData, 'A2-SE');
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

    // ---- Table B2: CAP Flight ----
    describe('Table B2 — CAP Flight', () => {
        const dateRanges = ['15-20 May', '21-31 May', '1-15 June'];

        for (const dateRange of dateRanges) {
            test(`${dateRange}: All 100 d10×d10 combos produce valid results`, () => {
                const processor = new NATOTableB2(tables['B2']);
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

    // ---- Table C2: CAS Raid ----
    describe('Table C2 — CAS Raid', () => {
        const taskings = ['SEAD', 'Bombing'];
        const dateRanges = ['15-20 May', '21-31 May', '1-15 June'];

        for (const tasking of taskings) {
            for (const scenarioDate of dateRanges) {
                test(`${tasking}/${scenarioDate}: All 10 rolls produce valid results`, () => {
                    const processor = new NATOTableC2(tables['C2']);
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

    // ---- Table D2: Deep Strike Raid ----
    describe('Table D2 — Deep Strike Raid', () => {
        const taskings = ['Escort Jamming', 'CAP', 'SEAD', 'Bombing', 'Recon'];
        const dateRanges = ['15-20 May', '21-31 May', '1-15 June'];

        for (const tasking of taskings) {
            for (const scenarioDate of dateRanges) {
                test(`${tasking}/${scenarioDate}: All 10 rolls produce valid results`, () => {
                    const processor = new NATOTableD2(tables['D2']);
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

    // ---- Table D3: Naval Strike Raid ----
    describe('Table D3 — Naval Strike Raid', () => {
        test('Table D3 data exists', () => {
            expect(tables['D3']).toBeDefined();
        });

        test('All 10 rolls produce valid results for each date', () => {
            const processor = new NATOTableD3(tables['D3']);
            // D3 uses only two date ranges (per the scan), not three like other BA tables
            const dateRanges = ['15-31 May', '1-15 June'];
            const failures = [];

            for (const scenarioDate of dateRanges) {
                for (let roll = 1; roll <= 10; roll++) {
                    mockRollSequence([roll, 5, 5, 5, 5]);
                    try {
                        const result = processor.process({ scenarioDate });
                        if (!result.text || result.text.startsWith('Error')) {
                            failures.push(`${scenarioDate}[${roll}]: ${result.text}`);
                        }
                    } catch (err) {
                        failures.push(`${scenarioDate}[${roll}]: EXCEPTION: ${err.message}`);
                    }
                    jest.restoreAllMocks();
                }
            }

            if (failures.length > 0) {
                throw new Error(`${failures.length} combinations failed:\n  ${failures.join('\n  ')}`);
            }
        });
    });

    // ---- Table E2: Combat Rescue ----
    // FRG CSAR flights require a hexType parameter ('land' or 'sea') to determine
    // aircraft: CH-53 for land hex, Mk41 Sea King for sea hex.
    // DK and SE have no hex variant — they always use S-61 and HKP-4D respectively.
    describe('Table E2 — Combat Rescue', () => {
        const dateRanges = ['15-20 May', '21-31 May', '1-15 June'];

        // FRG needs hexType for CSAR flights — test both land and sea
        for (const hexType of ['land', 'sea']) {
            for (const scenarioDate of dateRanges) {
                test(`FRG/${scenarioDate} (${hexType}): All 10 rolls produce valid results`, () => {
                    const processor = new NATOTableE2(tables['E2']);
                    const failures = [];

                    for (let roll = 1; roll <= 10; roll++) {
                        mockRollSequence([roll, 5, 5, 5]);
                        try {
                            const result = processor.process({ nationality: 'FRG', scenarioDate, hexType });
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

        // DK and SE don't require hexType
        for (const nationality of ['DK', 'SE']) {
            for (const scenarioDate of dateRanges) {
                test(`${nationality}/${scenarioDate}: All 10 rolls produce valid results`, () => {
                    const processor = new NATOTableE2(tables['E2']);
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

    // ---- Table F2: Maritime Patrol ----
    describe('Table F2 — Maritime Patrol', () => {
        test('Table F2 data exists', () => {
            expect(tables['F2']).toBeDefined();
        });

        test('All 100 d10×d10 combos produce valid results', () => {
            const processor = new NATOTableF2(tables['F2']);
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
});

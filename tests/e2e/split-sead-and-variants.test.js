/**
 * Split SEAD & F-4 Variant Tests — Tables C and D
 * ==================================================
 *
 * Targeted tests for three special aircraft resolution rules in the
 * Red Storm NATO OOB tables, verified against the physical rulebook
 * (RS_OOB2.pdf / RS_OOB3.pdf):
 *
 * 1. Table C SEAD — F-4G/F-4E (US, aircraft rolls 4-8):
 *    "This result means two SEAD flights are {2} F-4G and the other two
 *     are {2} F-4E as indicated" (footnote 1, RS_OOB2)
 *
 * 2. Table C SEAD — F-4G/F-16C (US, aircraft roll 9):
 *    Same footnote: two flights F-4G, two flights F-16C
 *
 * 3. Table C Bombing — F-4² (US, aircraft rolls 8-10):
 *    "Roll again. 1-5 F-4D; 6-10 F-4E" (footnote 2, RS_OOB2)
 *
 * 4. Table D SEAD — F-4G/F-4E (US, aircraft rolls 7-9):
 *    Same footnote 1 rule applies
 *
 * 5. Table D SEAD — F-4G/F-16C (US, aircraft roll 10):
 *    Same footnote 1 rule applies
 *
 * Each test calls processTasking() directly (rather than process()) so we
 * can precisely control the mock roll sequence for a single tasking and
 * inspect the output structure without interference from other taskings.
 *
 * Mock strategy:
 *   The dice rolling code uses: Math.floor(Math.random() * 10) + 1
 *   To force a specific d10 result R, we need: Math.random() → (R - 1) / 10
 *   We provide a sequence of mock values consumed in order.
 *
 * Roll sequences per test type:
 *   - Split SEAD (Table C): [nationRoll, aircraftRoll, ord1, ord2, ord3, ord4]
 *     (4 ordnance rolls: 2 per aircraft type)
 *   - Split SEAD (Table D): [nationRoll, aircraftRoll]
 *     (no ordnance rolls for Table D)
 *   - Bombing F-4² sub-roll: [nationRoll, aircraftRoll, subRoll, ord1, ord2, ord3, ord4]
 *     (1 sub-roll + 4 ordnance rolls for 4 bombing flights)
 */

require('../setup/load-processors');
const { loadRSNatoTables, loadAircraftNATO } = require('../helpers/table-data-loader');

/**
 * Create a mock Math.random that returns values from a queue.
 * Each call to Math.random() consumes the next value in the sequence.
 * If the sequence runs out, falls back to real random.
 *
 * @param {number[]} rollValues - d10 values (1-10) to produce in sequence
 */
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

describe('Split SEAD & F-4 Variant Rules (Tables C and D)', () => {
    let tables;
    let aircraftDB;

    beforeAll(() => {
        tables = loadRSNatoTables();
        aircraftDB = loadAircraftNATO();
        global.oobTables = tables;
        if (typeof window !== 'undefined') {
            window.oobTables = tables;
        }
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // =========================================================================
    //  Table C — SEAD Split: F-4G/F-4E
    // =========================================================================
    describe('Table C SEAD — F-4G/F-4E split (footnote 1)', () => {
        // Source: Table C SEAD, US nation, aircraft rolls 4-8
        // Pre-6/1/87: US = nation rolls 1-4
        // Post-6/1/87: US = nation rolls 1-6
        // Aircraft rolls 4-8 → "F-4G/F-4E" → split into 2×F-4G + 2×F-4E

        const testCases = [
            { scenarioDate: 'pre', nationRoll: 1, label: 'pre, US nation roll 1' },
            { scenarioDate: 'pre', nationRoll: 4, label: 'pre, US nation roll 4 (boundary)' },
            { scenarioDate: 'post', nationRoll: 1, label: 'post, US nation roll 1' },
            { scenarioDate: 'post', nationRoll: 6, label: 'post, US nation roll 6 (boundary)' },
        ];

        for (const tc of testCases) {
            for (const aircraftRoll of [4, 6, 8]) {
                test(`${tc.label}, aircraft roll ${aircraftRoll}: returns array of 2 entries (F-4G + F-4E)`, () => {
                    const processor = new NATOTableC(tables['C']);
                    // Rolls: nation, aircraft, then 4 ordnance rolls (2 per aircraft type)
                    mockRollSequence([tc.nationRoll, aircraftRoll, 3, 7, 2, 9]);

                    const result = processor.processTasking('SEAD', tc.scenarioDate);

                    // Must return an array (split result), not a single object
                    expect(Array.isArray(result)).toBe(true);
                    expect(result).toHaveLength(2);

                    // First entry: F-4G
                    expect(result[0].aircraftType).toBe('F-4G');
                    expect(result[0].tasking).toBe('SEAD');
                    expect(result[0].flightSize).toBe(2);
                    expect(result[0].flightCount).toBe(2);
                    expect(result[0].nationality).toBe('US');
                    expect(result[0].text).toContain('F-4G');
                    expect(result[0].text).toContain('SEAD');
                    expect(result[0].text).not.toContain('F-4E');

                    // Second entry: F-4E
                    expect(result[1].aircraftType).toBe('F-4E');
                    expect(result[1].tasking).toBe('SEAD');
                    expect(result[1].flightSize).toBe(2);
                    expect(result[1].flightCount).toBe(2);
                    expect(result[1].nationality).toBe('US');
                    expect(result[1].text).toContain('F-4E');
                    expect(result[1].text).toContain('SEAD');
                    expect(result[1].text).not.toContain('F-4G');
                });
            }
        }

        test('Each entry\'s aircraftType exists in the aircraft database', () => {
            const processor = new NATOTableC(tables['C']);
            mockRollSequence([1, 5, 5, 5, 5, 5]);
            const result = processor.processTasking('SEAD', 'pre');

            for (const entry of result) {
                expect(aircraftDB).toHaveProperty(entry.aircraftType);
            }
        });

        test('Ordnance text includes ARM for all SEAD flights', () => {
            const processor = new NATOTableC(tables['C']);
            mockRollSequence([1, 5, 3, 7, 2, 9]);
            const result = processor.processTasking('SEAD', 'pre');

            for (const entry of result) {
                // Each entry's text has 2 flight lines joined by <br>
                const flightLines = entry.text.split('<br>');
                expect(flightLines).toHaveLength(2);
                for (const line of flightLines) {
                    expect(line).toContain('ARM');
                }
            }
        });

        test('Total flight count across both entries is 4', () => {
            const processor = new NATOTableC(tables['C']);
            mockRollSequence([1, 5, 5, 5, 5, 5]);
            const result = processor.processTasking('SEAD', 'pre');
            const totalFlights = result.reduce((sum, entry) => sum + entry.flightCount, 0);
            expect(totalFlights).toBe(4);
        });
    });

    // =========================================================================
    //  Table C — SEAD Split: F-4G/F-16C
    // =========================================================================
    describe('Table C SEAD — F-4G/F-16C split (footnote 1)', () => {
        // Source: Table C SEAD, US nation, aircraft roll 9
        // Pre: US = nation rolls 1-4, Post: US = nation rolls 1-6

        const testCases = [
            { scenarioDate: 'pre', nationRoll: 2, label: 'pre, US' },
            { scenarioDate: 'post', nationRoll: 3, label: 'post, US' },
        ];

        for (const tc of testCases) {
            test(`${tc.label}, aircraft roll 9: returns array of 2 entries (F-4G + F-16C)`, () => {
                const processor = new NATOTableC(tables['C']);
                mockRollSequence([tc.nationRoll, 9, 5, 5, 5, 5]);

                const result = processor.processTasking('SEAD', tc.scenarioDate);

                expect(Array.isArray(result)).toBe(true);
                expect(result).toHaveLength(2);

                // First entry: F-4G
                expect(result[0].aircraftType).toBe('F-4G');
                expect(result[0].tasking).toBe('SEAD');
                expect(result[0].flightSize).toBe(2);
                expect(result[0].flightCount).toBe(2);
                expect(result[0].nationality).toBe('US');

                // Second entry: F-16C
                expect(result[1].aircraftType).toBe('F-16C');
                expect(result[1].tasking).toBe('SEAD');
                expect(result[1].flightSize).toBe(2);
                expect(result[1].flightCount).toBe(2);
                expect(result[1].nationality).toBe('US');
            });
        }

        test('Each entry\'s aircraftType exists in the aircraft database', () => {
            const processor = new NATOTableC(tables['C']);
            mockRollSequence([1, 9, 5, 5, 5, 5]);
            const result = processor.processTasking('SEAD', 'pre');

            for (const entry of result) {
                expect(aircraftDB).toHaveProperty(entry.aircraftType);
            }
        });

        test('F-16C flights get +2 ordnance modifier (better ordnance at same roll)', () => {
            const processor = new NATOTableC(tables['C']);
            // Roll 3 for ordnance: F-4G gets Bombs/CBU/Rockets (3 ≤ 4)
            // Roll 3 for ordnance: F-16C gets Bombs/CBU/Rockets + EOGM (3+2=5, in range 5-7)
            mockRollSequence([1, 9, 3, 3, 3, 3]);
            const result = processor.processTasking('SEAD', 'pre');

            // F-4G (no modifier): roll 3 → Bombs/CBU/Rockets + ARM
            const f4gLines = result[0].text.split('<br>');
            for (const line of f4gLines) {
                expect(line).toContain('Bombs/CBU/Rockets + ARM');
                expect(line).not.toContain('EOGM');
            }

            // F-16C (+2 modifier): roll 3+2=5 → Bombs/CBU/Rockets + EOGM + ARM
            const f16cLines = result[1].text.split('<br>');
            for (const line of f16cLines) {
                expect(line).toContain('EOGM');
                expect(line).toContain('ARM');
            }
        });
    });

    // =========================================================================
    //  Table C — Bombing F-4² Sub-Roll
    // =========================================================================
    describe('Table C Bombing — F-4² sub-roll (footnote 2)', () => {
        // Source: Table C Bombing, US nation, aircraft rolls 8-10
        // "Roll again. 1-5 F-4D; 6-10 F-4E"
        // Pre: US = nation rolls 1-4, Post: US = nation rolls 1-6

        test('Sub-roll 1-5 resolves to F-4D (pre)', () => {
            const processor = new NATOTableC(tables['C']);
            for (const subRoll of [1, 3, 5]) {
                // Rolls: nation=1 (US), aircraft=8 (F-4²), subRoll, then 4 ordnance rolls
                mockRollSequence([1, 8, subRoll, 5, 5, 5, 5]);
                const result = processor.processTasking('Bombing', 'pre');

                expect(result.aircraftType).toBe('F-4D');
                expect(result.nationality).toBe('US');
                expect(result.tasking).toBe('Bombing');
                expect(result.flightSize).toBe(4);
                expect(result.flightCount).toBe(4);
                expect(result.text).toContain('F-4D');
                expect(result.text).not.toContain('F-4E');
                jest.restoreAllMocks();
            }
        });

        test('Sub-roll 6-10 resolves to F-4E (pre)', () => {
            const processor = new NATOTableC(tables['C']);
            for (const subRoll of [6, 8, 10]) {
                mockRollSequence([1, 8, subRoll, 5, 5, 5, 5]);
                const result = processor.processTasking('Bombing', 'pre');

                expect(result.aircraftType).toBe('F-4E');
                expect(result.nationality).toBe('US');
                expect(result.tasking).toBe('Bombing');
                expect(result.text).toContain('F-4E');
                expect(result.text).not.toContain('F-4D');
                jest.restoreAllMocks();
            }
        });

        test('Sub-roll works for all three triggering aircraft rolls (8, 9, 10)', () => {
            const processor = new NATOTableC(tables['C']);
            for (const aircraftRoll of [8, 9, 10]) {
                // Sub-roll 3 → F-4D
                mockRollSequence([1, aircraftRoll, 3, 5, 5, 5, 5]);
                const resultD = processor.processTasking('Bombing', 'pre');
                expect(resultD.aircraftType).toBe('F-4D');
                jest.restoreAllMocks();

                // Sub-roll 7 → F-4E
                mockRollSequence([1, aircraftRoll, 7, 5, 5, 5, 5]);
                const resultE = processor.processTasking('Bombing', 'pre');
                expect(resultE.aircraftType).toBe('F-4E');
                jest.restoreAllMocks();
            }
        });

        test('Sub-roll works for post-6/1/87 scenario date', () => {
            const processor = new NATOTableC(tables['C']);

            mockRollSequence([1, 9, 2, 5, 5, 5, 5]);
            const resultD = processor.processTasking('Bombing', 'post');
            expect(resultD.aircraftType).toBe('F-4D');
            jest.restoreAllMocks();

            mockRollSequence([1, 9, 8, 5, 5, 5, 5]);
            const resultE = processor.processTasking('Bombing', 'post');
            expect(resultE.aircraftType).toBe('F-4E');
        });

        test('Resolved aircraft types exist in the aircraft database', () => {
            const processor = new NATOTableC(tables['C']);

            mockRollSequence([1, 8, 1, 5, 5, 5, 5]);
            const resultD = processor.processTasking('Bombing', 'pre');
            expect(aircraftDB).toHaveProperty(resultD.aircraftType);
            jest.restoreAllMocks();

            mockRollSequence([1, 8, 10, 5, 5, 5, 5]);
            const resultE = processor.processTasking('Bombing', 'pre');
            expect(aircraftDB).toHaveProperty(resultE.aircraftType);
        });

        test('Resolved aircraft has valid aircraftId', () => {
            const processor = new NATOTableC(tables['C']);

            mockRollSequence([1, 8, 1, 5, 5, 5, 5]);
            const resultD = processor.processTasking('Bombing', 'pre');
            expect(resultD.aircraftId).toBe('US-F-4D-1');
            jest.restoreAllMocks();

            mockRollSequence([1, 8, 10, 5, 5, 5, 5]);
            const resultE = processor.processTasking('Bombing', 'pre');
            expect(resultE.aircraftId).toBe('US-F-4E-1');
        });

        test('Is NOT a split (returns single object, not array)', () => {
            const processor = new NATOTableC(tables['C']);
            mockRollSequence([1, 8, 5, 5, 5, 5, 5]);
            const result = processor.processTasking('Bombing', 'pre');

            // The F-4² sub-roll resolves to a SINGLE aircraft type, not a split
            expect(Array.isArray(result)).toBe(false);
            expect(result).toHaveProperty('aircraftType');
            expect(result.aircraftType).not.toContain('/');
        });
    });

    // =========================================================================
    //  Table D — SEAD Split: F-4G/F-4E
    // =========================================================================
    describe('Table D SEAD — F-4G/F-4E split (footnote 1)', () => {
        // Source: Table D SEAD, US nation (rolls 1-6), aircraft rolls 7-9
        // No ordnance rolls for Table D (grouped flights)

        for (const aircraftRoll of [7, 8, 9]) {
            test(`US, aircraft roll ${aircraftRoll}: returns array of 2 entries (F-4G + F-4E)`, () => {
                const processor = new NATOTableD(tables['D']);
                mockRollSequence([1, aircraftRoll]);

                const result = processor.processTasking('SEAD');

                expect(Array.isArray(result)).toBe(true);
                expect(result).toHaveLength(2);

                // First entry: F-4G
                expect(result[0].aircraftType).toBe('F-4G');
                expect(result[0].tasking).toBe('SEAD');
                expect(result[0].flightSize).toBe(2);
                expect(result[0].flightCount).toBe(2);
                expect(result[0].nationality).toBe('US');
                expect(result[0].text).toBe('2 x {2} US F-4G, SEAD');

                // Second entry: F-4E
                expect(result[1].aircraftType).toBe('F-4E');
                expect(result[1].tasking).toBe('SEAD');
                expect(result[1].flightSize).toBe(2);
                expect(result[1].flightCount).toBe(2);
                expect(result[1].nationality).toBe('US');
                expect(result[1].text).toBe('2 x {2} US F-4E, SEAD');
            });
        }

        test('Each entry\'s aircraftType exists in the aircraft database', () => {
            const processor = new NATOTableD(tables['D']);
            mockRollSequence([1, 8]);
            const result = processor.processTasking('SEAD');

            for (const entry of result) {
                expect(aircraftDB).toHaveProperty(entry.aircraftType);
            }
        });

        test('Total flight count across both entries is 4', () => {
            const processor = new NATOTableD(tables['D']);
            mockRollSequence([1, 7]);
            const result = processor.processTasking('SEAD');
            const totalFlights = result.reduce((sum, e) => sum + e.flightCount, 0);
            expect(totalFlights).toBe(4);
        });
    });

    // =========================================================================
    //  Table D — SEAD Split: F-4G/F-16C
    // =========================================================================
    describe('Table D SEAD — F-4G/F-16C split (footnote 1)', () => {
        // Source: Table D SEAD, US nation (rolls 1-6), aircraft roll 10

        test('US, aircraft roll 10: returns array of 2 entries (F-4G + F-16C)', () => {
            const processor = new NATOTableD(tables['D']);
            mockRollSequence([1, 10]);

            const result = processor.processTasking('SEAD');

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);

            expect(result[0].aircraftType).toBe('F-4G');
            expect(result[0].flightCount).toBe(2);
            expect(result[0].text).toBe('2 x {2} US F-4G, SEAD');

            expect(result[1].aircraftType).toBe('F-16C');
            expect(result[1].flightCount).toBe(2);
            expect(result[1].text).toBe('2 x {2} US F-16C, SEAD');
        });

        test('Each entry\'s aircraftType exists in the aircraft database', () => {
            const processor = new NATOTableD(tables['D']);
            mockRollSequence([1, 10]);
            const result = processor.processTasking('SEAD');

            for (const entry of result) {
                expect(aircraftDB).toHaveProperty(entry.aircraftType);
            }
        });
    });

    // =========================================================================
    //  Integration: process() flattening
    // =========================================================================
    describe('process() correctly flattens split SEAD entries into taskings array', () => {

        test('Table C: split SEAD produces separate entries in taskings[]', () => {
            const processor = new NATOTableC(tables['C']);
            // CAP: nation=1, aircraft=1 (US, normal)
            // SEAD: nation=1, aircraft=5 → US, F-4G/F-4E split
            //   4 ordnance rolls for the split
            // Bombing: nation=1, aircraft=1 (US, normal)
            //   4 ordnance rolls
            mockRollSequence([
                1, 1,           // CAP: nation, aircraft
                1, 5,           // SEAD: nation=1 (US), aircraft=5 (F-4G/F-4E)
                5, 5, 5, 5,    // SEAD ordnance (2 per aircraft type)
                1, 1,           // Bombing: nation, aircraft
                5, 5, 5, 5     // Bombing ordnance (4 flights)
            ]);

            const result = processor.process({ scenarioDate: 'pre' });

            expect(result).toHaveProperty('taskings');
            expect(Array.isArray(result.taskings)).toBe(true);

            // Should be 4 entries: 1 CAP + 2 SEAD (split) + 1 Bombing
            expect(result.taskings).toHaveLength(4);

            // Verify the SEAD entries are properly split
            const seadEntries = result.taskings.filter(t => t.tasking === 'SEAD');
            expect(seadEntries).toHaveLength(2);
            expect(seadEntries[0].aircraftType).toBe('F-4G');
            expect(seadEntries[1].aircraftType).toBe('F-4E');

            // No entry should have a "/" in aircraftType
            for (const entry of result.taskings) {
                expect(entry.aircraftType).not.toContain('/');
            }
        });

        test('Table D: split SEAD produces separate entries in taskings[]', () => {
            const processor = new NATOTableD(tables['D']);
            // Escort Jamming: nation=1, aircraft=1
            // CAP: nation=1, aircraft=1
            // SEAD: nation=1, aircraft=8 → US, F-4G/F-4E split
            // Bombing: nation=1, aircraft=1
            // Recon: nation=1, aircraft=1
            mockRollSequence([
                1, 1,   // Escort Jamming
                1, 1,   // CAP
                1, 8,   // SEAD: US, F-4G/F-4E
                1, 1,   // Bombing
                1, 1    // Recon
            ]);

            const result = processor.process({});

            expect(result).toHaveProperty('taskings');
            expect(Array.isArray(result.taskings)).toBe(true);

            // Should be 6: Escort Jamming + CAP + 2 SEAD (split) + Bombing + Recon
            expect(result.taskings).toHaveLength(6);

            const seadEntries = result.taskings.filter(t => t.tasking === 'SEAD');
            expect(seadEntries).toHaveLength(2);
            expect(seadEntries[0].aircraftType).toBe('F-4G');
            expect(seadEntries[1].aircraftType).toBe('F-4E');

            // No SEAD entry should have a "/" in aircraftType
            // (Note: Bombing may legitimately have "/" in names like "F-111D/E")
            for (const entry of seadEntries) {
                expect(entry.aircraftType).not.toContain('/');
            }
        });

        test('Table C: non-split SEAD (F-4G only) returns single entry', () => {
            const processor = new NATOTableC(tables['C']);
            // SEAD: nation=1 (US), aircraft=2 (F-4G, rolls 1-3)
            mockRollSequence([
                1, 1,           // CAP
                1, 2,           // SEAD: US, F-4G (single, not split)
                5, 5, 5, 5,    // SEAD ordnance (4 flights)
                1, 1,           // Bombing
                5, 5, 5, 5     // Bombing ordnance
            ]);

            const result = processor.process({ scenarioDate: 'pre' });
            const seadEntries = result.taskings.filter(t => t.tasking === 'SEAD');

            // Single F-4G entry, not split
            expect(seadEntries).toHaveLength(1);
            expect(seadEntries[0].aircraftType).toBe('F-4G');
            expect(seadEntries[0].flightCount).toBe(4);
        });

        test('Table D: non-split SEAD (F-4G only) returns single entry', () => {
            const processor = new NATOTableD(tables['D']);
            // SEAD: US, aircraft roll 3 → F-4G (rolls 1-6)
            mockRollSequence([
                1, 1,   // Escort Jamming
                1, 1,   // CAP
                1, 3,   // SEAD: US, F-4G (single)
                1, 1,   // Bombing
                1, 1    // Recon
            ]);

            const result = processor.process({});
            const seadEntries = result.taskings.filter(t => t.tasking === 'SEAD');

            expect(seadEntries).toHaveLength(1);
            expect(seadEntries[0].aircraftType).toBe('F-4G');
            expect(seadEntries[0].flightCount).toBe(4);
        });
    });

    // =========================================================================
    //  Data integrity: JSON table entries match source rules
    // =========================================================================
    describe('JSON data matches source rules (RS_OOB2.pdf)', () => {

        test('Table C SEAD pre: US aircraft 4-8 is F-4G/F-4E with null aircraftId', () => {
            const usAircraft = tables['C'].taskings.SEAD.pre.nations['1-4'].aircraft;
            expect(usAircraft['4-8'].name).toBe('F-4G/F-4E');
            expect(usAircraft['4-8'].aircraftId).toBeNull();
        });

        test('Table C SEAD pre: US aircraft 9 is F-4G/F-16C with null aircraftId', () => {
            const usAircraft = tables['C'].taskings.SEAD.pre.nations['1-4'].aircraft;
            expect(usAircraft['9'].name).toBe('F-4G/F-16C');
            expect(usAircraft['9'].aircraftId).toBeNull();
        });

        test('Table C SEAD post: US aircraft 4-8 is F-4G/F-4E, 9 is F-4G/F-16C', () => {
            const usAircraft = tables['C'].taskings.SEAD.post.nations['1-6'].aircraft;
            expect(usAircraft['4-8'].name).toBe('F-4G/F-4E');
            expect(usAircraft['9'].name).toBe('F-4G/F-16C');
        });

        test('Table C Bombing pre: US aircraft 8-10 is F-4² with variants', () => {
            const usAircraft = tables['C'].taskings.Bombing.pre.nations['1-4'].aircraft;
            const f4Entry = usAircraft['8-10'];
            expect(f4Entry.name).toBe('F-4\u00b2');  // F-4 with superscript 2
            expect(f4Entry.aircraftId).toBeNull();
            expect(f4Entry.variants).toBeDefined();
            expect(f4Entry.variants['1-5'].name).toBe('F-4D');
            expect(f4Entry.variants['1-5'].aircraftId).toBe('US-F-4D-1');
            expect(f4Entry.variants['6-10'].name).toBe('F-4E');
            expect(f4Entry.variants['6-10'].aircraftId).toBe('US-F-4E-1');
        });

        test('Table C Bombing post: US aircraft 8-10 is F-4² with variants', () => {
            const usAircraft = tables['C'].taskings.Bombing.post.nations['1-6'].aircraft;
            const f4Entry = usAircraft['8-10'];
            expect(f4Entry.name).toBe('F-4\u00b2');
            expect(f4Entry.variants).toBeDefined();
            expect(f4Entry.variants['1-5'].name).toBe('F-4D');
            expect(f4Entry.variants['6-10'].name).toBe('F-4E');
        });

        test('Table D SEAD: US aircraft 7-9 is F-4G/F-4E, 10 is F-4G/F-16C', () => {
            const usAircraft = tables['D'].taskings.SEAD.nations['1-6'].aircraft;
            expect(usAircraft['7-9'].name).toBe('F-4G/F-4E');
            expect(usAircraft['7-9'].aircraftId).toBeNull();
            expect(usAircraft['10'].name).toBe('F-4G/F-16C');
            expect(usAircraft['10'].aircraftId).toBeNull();
        });

        test('All referenced individual aircraft exist in aircraft-nato.json', () => {
            const requiredAircraft = ['F-4G', 'F-4E', 'F-4D', 'F-16C'];
            for (const name of requiredAircraft) {
                expect(aircraftDB).toHaveProperty(name);
                expect(aircraftDB[name]).toHaveProperty('id');
            }
        });
    });
});

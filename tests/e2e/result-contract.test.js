/**
 * Result Contract Tests — Validate ResultSchema Normalize & Per-Processor Contract
 * ==================================================================================
 *
 * Two test suites:
 *
 *   1. ResultSchema.normalize() unit tests
 *      Feed known shapes from each result category and verify the normalized
 *      output has the correct canonical structure and field values.
 *
 *   2. Per-processor contract validation
 *      For each of the 27 processors: instantiate with real table data,
 *      mock rolls to produce a representative result, run through normalize()
 *      then validate(), and assert zero validation errors.
 *
 * These tests ensure that the ResultSchema adapter layer can handle every
 * result shape the processors currently produce, BEFORE any processor code
 * is changed.
 *
 * Mock strategy:
 *   Same as other e2e tests — Math.random() is mocked to force specific
 *   d10 rolls. Each processor gets mid-range rolls (5) to exercise common
 *   code paths without triggering edge-case branches.
 */

require('../setup/load-processors');
const {
    loadRSNatoTables,
    loadRSWPTables,
    loadBANatoTables,
    loadBAWPTables,
} = require('../helpers/table-data-loader');

// ---------------------------------------------------------------------------
//  Test utilities
// ---------------------------------------------------------------------------

/**
 * Mock Math.random() to return values producing specific d10 results.
 * d10 formula: Math.floor(Math.random() * 10) + 1
 * To get roll R: Math.random() → (R - 1) / 10
 *
 * @param {number[]} rollValues - d10 results (1-10) to produce in order
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

// ===========================================================================
//  SUITE 1: ResultSchema.normalize() Unit Tests
// ===========================================================================

describe('ResultSchema.normalize() — Unit Tests', () => {

    // --- Null / undefined / empty inputs ---

    test('null input returns empty canonical result', () => {
        const result = ResultSchema.normalize(null, 'NATO');
        expect(result).toHaveProperty('table');
        expect(result).toHaveProperty('faction', 'NATO');
        expect(result).toHaveProperty('flights');
        expect(Array.isArray(result.flights)).toBe(true);
    });

    test('undefined input returns empty canonical result', () => {
        const result = ResultSchema.normalize(undefined, 'WP');
        expect(result.faction).toBe('WP');
        expect(result.flights).toEqual([]);
    });

    // --- Shape 1: Single-flight (flat object from Tables A, B, G, H) ---

    describe('Single-flight shape (Tables A, B, G, H style)', () => {
        test('wraps flat result into flights[1]', () => {
            const raw = {
                nationRoll: 3,
                aircraftRoll: 7,
                nationName: 'US',
                nationality: 'US',
                aircraftType: 'F-15C',
                aircraftId: 'nato-f15c',
                flightSize: 4,
                flightCount: 1,
                tasking: 'CAP',
                sourceTable: 'A',
                text: '4× F-15C (US) — CAP',
                debugText: '[Roll 3,7]',
            };

            const result = ResultSchema.normalize(raw, 'NATO');

            expect(result.table).toBe('A');
            expect(result.faction).toBe('NATO');
            expect(result.flights).toHaveLength(1);
            expect(result.debugRolls).toBe('[Roll 3,7]');

            const flight = result.flights[0];
            expect(flight.aircraftType).toBe('F-15C');
            expect(flight.nationality).toBe('US');
            expect(flight.tasking).toBe('CAP');
            expect(flight.flightSize).toBe(4);
            expect(flight.flightCount).toBe(1);
            expect(flight.aircraftId).toBe('nato-f15c');
        });

        test('resolves alias: nationName → nationality when nationality is missing', () => {
            const raw = {
                nationName: 'FRG',
                aircraftType: 'Tornado IDS',
                flightSize: 4,
                flightCount: 1,
                tasking: 'Bombing',
                sourceTable: 'B',
                text: 'test',
            };

            const result = ResultSchema.normalize(raw, 'NATO');
            expect(result.flights[0].nationality).toBe('FRG');
        });
    });

    // --- Shape 2: Multi-tasking (Tables C, D, I, J) ---

    describe('Multi-tasking shape (Tables C, D, I, J style)', () => {
        test('maps taskings[] into flights[]', () => {
            const raw = {
                taskings: [
                    {
                        tasking: 'CAP',
                        nationName: 'US',
                        nationality: 'US',
                        aircraftType: 'F-15C',
                        aircraftId: 'nato-f15c',
                        flightSize: 4,
                        flightCount: 4,
                        text: 'CAP flights',
                        debugText: '[CAP roll]',
                    },
                    {
                        tasking: 'SEAD',
                        nationName: 'US',
                        nationality: 'US',
                        aircraftType: 'F-4G',
                        aircraftId: 'nato-f4g',
                        flightSize: 2,
                        flightCount: 2,
                        text: 'SEAD flights',
                        debugText: '[SEAD roll]',
                    },
                ],
                text: 'Combined text',
                debugText: 'Combined debug',
            };

            const result = ResultSchema.normalize(raw, 'NATO');

            expect(result.flights).toHaveLength(2);
            expect(result.flights[0].tasking).toBe('CAP');
            expect(result.flights[0].aircraftType).toBe('F-15C');
            expect(result.flights[0].flightCount).toBe(4);
            expect(result.flights[1].tasking).toBe('SEAD');
            expect(result.flights[1].aircraftType).toBe('F-4G');
            expect(result.text).toBe('Combined text');
            expect(result.debugRolls).toBe('Combined debug');
        });
    });

    // --- Shape 3: Flights-array with table + faction (Tables D3, J3) ---

    describe('Flights-array shape (Tables D3, J3 style)', () => {
        test('already-canonical flights[] passes through with normalization', () => {
            const raw = {
                table: 'D3',
                faction: 'NATO',
                raidType: 'Naval Strike',
                nationality: 'UK',
                flights: [
                    {
                        aircraftType: 'Tornado GR.1',
                        aircraftId: 'nato-tornado-gr1',
                        nationality: 'UK',
                        actualNationality: 'UK',
                        tasking: 'Naval Strike',
                        flightSize: 4,
                        flightCount: 2,
                        text: 'Strike flights',
                    },
                    {
                        aircraftType: 'F-16A',
                        aircraftId: 'nato-f16a',
                        nationality: 'DK',
                        actualNationality: 'DK',
                        tasking: 'Combat Air Patrol',
                        flightSize: 4,
                        flightCount: 1,
                        text: 'CAP flights',
                    },
                ],
                text: 'Naval Strike Raid',
                debugRolls: ['[Roll 5]'],
            };

            const result = ResultSchema.normalize(raw, 'NATO');

            expect(result.table).toBe('D3');
            expect(result.faction).toBe('NATO');
            expect(result.raidType).toBe('Naval Strike');
            expect(result.flights).toHaveLength(2);
            expect(result.flights[0].aircraftType).toBe('Tornado GR.1');
            expect(result.flights[1].nationality).toBe('DK');
        });

        test('WP flights-array (J3 style) with aircraft alias', () => {
            const raw = {
                table: 'J3',
                faction: 'WP',
                nationality: 'USSR',
                flights: [
                    {
                        aircraft: 'Su-24',        // alias → aircraftType
                        aircraftType: 'Su-24',
                        nationality: 'USSR',
                        tasking: 'Naval Strike',
                        flightSize: 4,
                        flightCount: 2,
                        ordnance: 'AS-7 Kerry',
                    },
                ],
                text: 'Naval Strike',
                debugRolls: ['[Roll 3]'],
            };

            const result = ResultSchema.normalize(raw, 'WP');

            expect(result.flights[0].aircraftType).toBe('Su-24');
            expect(result.flights[0].ordnance).toBe('AS-7 Kerry');
        });
    });

    // --- Shape 4: Combat rescue with flightResults (Table E) ---

    describe('Combat rescue shape (Table E style)', () => {
        test('maps flightResults[] into flights[] when flights[] is absent', () => {
            // Simulate a result that only has flightResults (no flights alias)
            const raw = {
                table: 'E',
                faction: 'NATO',
                nationality: 'US',
                raidType: 'US rescue package',
                flightResults: [
                    {
                        flightType: 'Rescue',       // alias → tasking
                        nationality: 'US',
                        aircraftType: 'HH-53',
                        aircraftId: null,
                        flightSize: 2,
                        flightCount: 1,
                        tasking: 'Rescue',
                        text: 'Rescue helicopter',
                    },
                    {
                        flightType: 'Escort',
                        nationality: 'US',
                        aircraftType: 'A-7D',
                        aircraftId: 'nato-a7d',
                        flightSize: 4,
                        flightCount: 1,
                        tasking: 'Escort',
                        text: 'Escort flight',
                    },
                ],
                text: 'US rescue package',
                debugText: '[E rolls]',
            };

            const result = ResultSchema.normalize(raw, 'NATO');

            expect(result.table).toBe('E');
            expect(result.flights).toHaveLength(2);
            expect(result.flights[0].tasking).toBe('Rescue');
            expect(result.flights[0].aircraftType).toBe('HH-53');
            expect(result.flights[1].tasking).toBe('Escort');
            expect(result.debugRolls).toBe('[E rolls]');
        });

        test('combat rescue with both flights[] and flightResults[] uses flights[] (Case 1)', () => {
            // Table E returns both flightResults AND flights pointing to same data.
            // Since it also has table + faction, Case 1 catches it.
            const raw = {
                table: 'E',
                faction: 'NATO',
                nationality: 'US',
                raidType: 'US rescue package',
                flightResults: [
                    { flightType: 'Rescue', nationality: 'US', aircraftType: 'HH-53', flightSize: 2, flightCount: 1, tasking: 'Rescue', text: 'helo' },
                ],
                flights: [
                    { flightType: 'Rescue', nationality: 'US', aircraftType: 'HH-53', flightSize: 2, flightCount: 1, tasking: 'Rescue', text: 'helo' },
                ],
                text: 'US rescue package',
                debugText: '[E rolls]',
            };

            const result = ResultSchema.normalize(raw, 'NATO');

            // Case 1 should handle this since table + faction + flights[] are all present
            expect(result.flights).toHaveLength(1);
            expect(result.flights[0].tasking).toBe('Rescue');
        });
    });

    // --- Alias resolution ---

    describe('Field alias resolution', () => {
        test('aircraft → aircraftType', () => {
            const raw = {
                aircraft: 'MiG-29',
                nationality: 'USSR',
                tasking: 'CAP',
                flightSize: 4,
                flightCount: 2,
                sourceTable: 'G',
                text: 'test',
            };
            const result = ResultSchema.normalize(raw, 'WP');
            expect(result.flights[0].aircraftType).toBe('MiG-29');
        });

        test('quantity → flightCount', () => {
            const raw = {
                aircraftType: 'F-4E',
                nationality: 'US',
                tasking: 'Bombing',
                flightSize: 4,
                quantity: 3,
                sourceTable: 'C',
                text: 'test',
            };
            const result = ResultSchema.normalize(raw, 'NATO');
            expect(result.flights[0].flightCount).toBe(3);
        });

        test('flightType → tasking (when no tasking field)', () => {
            const raw = {
                aircraftType: 'HH-53',
                nationality: 'US',
                flightType: 'Rescue',
                flightSize: 2,
                flightCount: 1,
                sourceTable: 'E',
                text: 'test',
            };
            const result = ResultSchema.normalize(raw, 'NATO');
            expect(result.flights[0].tasking).toBe('Rescue');
        });
    });
});

// ===========================================================================
//  SUITE 2: Per-Processor Contract Validation
// ===========================================================================
//
//  For each of the 27 processors:
//    1. Instantiate with real table data
//    2. Mock rolls for a representative result
//    3. Run the result through normalize() + validate()
//    4. Assert zero validation errors
//
//  This proves that normalize() can handle every processor's actual output
//  without any processor code changes.
// ===========================================================================

describe('Per-Processor Contract Validation', () => {
    let rsNato, rsWP, baNato, baWP;

    beforeAll(() => {
        rsNato = loadRSNatoTables();
        rsWP   = loadRSWPTables();
        baNato = loadBANatoTables();
        baWP   = loadBAWPTables();

        // Make table data available globally (some processors read oobTables)
        global.oobTables = { ...rsNato, ...rsWP, ...baNato, ...baWP };
        if (typeof window !== 'undefined') {
            window.oobTables = global.oobTables;
        }

        // BA processors need date range constants
        global.BA_DATE_RANGES = ['15-20 May', '21-31 May', '1-15 June'];
        if (typeof window !== 'undefined') {
            window.BA_DATE_RANGES = global.BA_DATE_RANGES;
        }
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    /**
     * Helper: run a processor and validate the normalized result.
     * Returns the validation errors array (empty = pass).
     *
     * @param {object} processor - Table processor instance
     * @param {object} params - Parameters for process()
     * @param {string} faction - 'NATO' or 'WP'
     * @param {string} tableLabel - Label for error messages
     * @param {number[]} mockRolls - d10 values to mock
     * @param {string} [tableId] - Table ID fallback for normalize()
     * @returns {string[]} Validation errors
     */
    function processAndValidate(processor, params, faction, tableLabel, mockRolls, tableId) {
        mockRollSequence(mockRolls);
        let result;
        try {
            result = processor.process(params);
        } catch (err) {
            return [`${tableLabel}: process() threw: ${err.message}`];
        }

        if (!result || (result.text && result.text.startsWith('Error'))) {
            return [`${tableLabel}: processor returned error: ${result?.text || 'null result'}`];
        }

        // Suppress console.warn during validation (we're testing, not debugging)
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        const normalized = ResultSchema.normalize(result, faction, tableId);
        const errors = ResultSchema.validate(normalized, tableLabel);

        warnSpy.mockRestore();
        jest.restoreAllMocks();
        return errors;
    }

    // -----------------------------------------------------------------------
    //  Red Storm NATO (Tables A-F)
    // -----------------------------------------------------------------------

    describe('RS NATO — Tables A-F', () => {

        test('Table A: NATOTableA normalizes cleanly', () => {
            const processor = new NATOTableA(rsNato['A']);
            const errors = processAndValidate(
                processor,
                { atafZone: '2ATAF', scenarioDate: 'pre' },
                'NATO', 'Table A', [5, 5, 5]
            );
            expect(errors).toEqual([]);
        });

        test('Table B: NATOTableB normalizes cleanly', () => {
            const processor = new NATOTableB(rsNato['B']);
            const errors = processAndValidate(
                processor,
                { atafZone: '2ATAF', scenarioDate: 'pre' },
                'NATO', 'Table B', [5, 5, 5]
            );
            expect(errors).toEqual([]);
        });

        test('Table C: NATOTableC (multi-tasking) normalizes cleanly', () => {
            const processor = new NATOTableC(rsNato['C']);
            const errors = processAndValidate(
                processor,
                { tasking: 'CAP', scenarioDate: 'pre' },
                'NATO', 'Table C', [5, 5, 5, 5, 5, 5], 'C'
            );
            expect(errors).toEqual([]);
        });

        test('Table D: NATOTableD (multi-tasking) normalizes cleanly', () => {
            const processor = new NATOTableD(rsNato['D']);
            const errors = processAndValidate(
                processor,
                { tasking: 'Escort Jamming', scenarioDate: 'pre' },
                'NATO', 'Table D', [5, 5, 5, 5, 5, 5], 'D'
            );
            expect(errors).toEqual([]);
        });

        test('Table E: NATOTableE (combat rescue) normalizes cleanly', () => {
            const processor = new NATOTableE(rsNato['E']);
            const errors = processAndValidate(
                processor,
                { nationality: 'US', scenarioDate: 'pre' },
                'NATO', 'Table E', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });

        test('Table F: NATOTableF (special missions) normalizes cleanly', () => {
            const processor = new NATOTableF(rsNato['F']);
            // Use first available missionType
            const missionTypes = Object.keys(rsNato['F'].missionTypes || {});
            const missionType = missionTypes[0] || 'Fast FAC';
            const errors = processAndValidate(
                processor,
                { missionType, scenarioDate: 'pre' },
                'NATO', 'Table F', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });
    });

    // -----------------------------------------------------------------------
    //  BA NATO (Tables A2-F2)
    // -----------------------------------------------------------------------

    describe('BA NATO — Tables A2-F2', () => {

        test('Table A2: NATOTableA2 normalizes cleanly', () => {
            const processor = new NATOTableA2(baNato['A2']);
            const errors = processAndValidate(
                processor,
                { scenarioDate: '15-20 May' },
                'NATO', 'Table A2', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });

        test('Table A2-SE: NATOTableA2 (Swedish) normalizes cleanly', () => {
            const processor = new NATOTableA2(baNato['A2-SE'], 'A2-SE');
            const errors = processAndValidate(
                processor,
                {},
                'NATO', 'Table A2-SE', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });

        test('Table B2: NATOTableB2 normalizes cleanly', () => {
            const processor = new NATOTableB2(baNato['B2']);
            const errors = processAndValidate(
                processor,
                { scenarioDate: '15-20 May' },
                'NATO', 'Table B2', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });

        test('Table C2: NATOTableC2 normalizes cleanly', () => {
            const processor = new NATOTableC2(baNato['C2']);
            const errors = processAndValidate(
                processor,
                { tasking: 'SEAD', scenarioDate: '15-20 May' },
                'NATO', 'Table C2', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });

        test('Table D2: NATOTableD2 normalizes cleanly', () => {
            const processor = new NATOTableD2(baNato['D2']);
            const errors = processAndValidate(
                processor,
                { tasking: 'Escort Jamming', scenarioDate: '15-20 May' },
                'NATO', 'Table D2', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });

        test('Table D3: NATOTableD3 (naval strike) normalizes cleanly', () => {
            const processor = new NATOTableD3(baNato['D3']);
            const errors = processAndValidate(
                processor,
                { scenarioDate: '15-31 May' },
                'NATO', 'Table D3', [5, 5, 5, 5, 5], 'D3'
            );
            expect(errors).toEqual([]);
        });

        test('Table E2: NATOTableE2 (FRG combat rescue) normalizes cleanly', () => {
            const processor = new NATOTableE2(baNato['E2']);
            const errors = processAndValidate(
                processor,
                { nationality: 'FRG', scenarioDate: '15-20 May', hexType: 'land' },
                'NATO', 'Table E2 FRG', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });

        test('Table E2: NATOTableE2 (DK combat rescue) normalizes cleanly', () => {
            const processor = new NATOTableE2(baNato['E2']);
            const errors = processAndValidate(
                processor,
                { nationality: 'DK', scenarioDate: '15-20 May' },
                'NATO', 'Table E2 DK', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });

        test('Table F2: NATOTableF2 normalizes cleanly', () => {
            const processor = new NATOTableF2(baNato['F2']);
            const errors = processAndValidate(
                processor,
                {},
                'NATO', 'Table F2', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });
    });

    // -----------------------------------------------------------------------
    //  Red Storm WP (Tables G-L)
    // -----------------------------------------------------------------------

    describe('RS WP — Tables G-L', () => {

        test('Table G: WPTableG normalizes cleanly', () => {
            const processor = new WPTableG(rsWP['G']);
            const errors = processAndValidate(
                processor,
                {},
                'WP', 'Table G', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });

        test('Table H: WPTableH normalizes cleanly', () => {
            const processor = new WPTableH(rsWP['H']);
            const errors = processAndValidate(
                processor,
                {},
                'WP', 'Table H', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });

        test('Table I: WPTableI (multi-tasking) normalizes cleanly', () => {
            const processor = new WPTableI(rsWP['I']);
            const errors = processAndValidate(
                processor,
                { nationality: 'USSR', tasking: 'CAP', scenarioDate: 'pre' },
                'WP', 'Table I', [5, 5, 5, 5], 'I'
            );
            expect(errors).toEqual([]);
        });

        test('Table J: WPTableJ (multi-tasking) normalizes cleanly', () => {
            const processor = new WPTableJ(rsWP['J']);
            const errors = processAndValidate(
                processor,
                { tasking: 'Escort Jamming', scenarioDate: 'pre' },
                'WP', 'Table J', [5, 5, 5, 5], 'J'
            );
            expect(errors).toEqual([]);
        });

        test('Table K: WPTableK normalizes cleanly', () => {
            const processor = new WPTableK(rsWP['K']);
            const errors = processAndValidate(
                processor,
                { nationality: 'USSR', scenarioDate: 'pre' },
                'WP', 'Table K', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });

        test('Table L: WPTableL (special missions) normalizes cleanly', () => {
            const processor = new WPTableL(rsWP['L']);
            const missionTypes = Object.keys(rsWP['L'].missionTypes || {});
            const missionType = missionTypes[0] || 'Standoff Jamming';
            const errors = processAndValidate(
                processor,
                { missionType },
                'WP', 'Table L', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });
    });

    // -----------------------------------------------------------------------
    //  BA WP (Tables G2-L2)
    // -----------------------------------------------------------------------

    describe('BA WP — Tables G2-L2', () => {

        test('Table G2: WPTableG2 normalizes cleanly', () => {
            const processor = new WPTableG2(baWP['G2']);
            const errors = processAndValidate(
                processor,
                { scenarioDate: '15-20 May' },
                'WP', 'Table G2', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });

        test('Table H2: WPTableH2 normalizes cleanly', () => {
            const processor = new WPTableH2(baWP['H2']);
            const errors = processAndValidate(
                processor,
                { scenarioDate: '15-31 May' },
                'WP', 'Table H2', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });

        test('Table I2: WPTableI2 (multi-tasking) normalizes cleanly', () => {
            const processor = new WPTableI2(baWP['I2']);
            const errors = processAndValidate(
                processor,
                { nationality: 'GDR', tasking: 'CAP', scenarioDate: '15-20 May' },
                'WP', 'Table I2', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });

        test('Table J2: WPTableJ2 normalizes cleanly', () => {
            const processor = new WPTableJ2(baWP['J2']);
            const errors = processAndValidate(
                processor,
                { tasking: 'Escort Jamming', scenarioDate: '15-20 May' },
                'WP', 'Table J2', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });

        test('Table J3: WPTableJ3 (naval strike) normalizes cleanly', () => {
            const processor = new WPTableJ3(baWP['J3']);
            const errors = processAndValidate(
                processor,
                { nationality: 'USSR', scenarioDate: '15-20 May' },
                'WP', 'Table J3', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });

        test('Table K2: WPTableK2 normalizes cleanly', () => {
            const processor = new WPTableK2(baWP['K2']);
            const errors = processAndValidate(
                processor,
                { nationality: 'GDR', scenarioDate: '15-20 May' },
                'WP', 'Table K2', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });

        test('Table L2: WPTableL2 (special missions) normalizes cleanly', () => {
            const processor = new WPTableL2(baWP['L2']);
            const missionTypes = Object.keys(baWP['L2'].missionTypes || {});
            const missionType = missionTypes[0] || 'Standoff Jamming';
            const errors = processAndValidate(
                processor,
                { missionType, scenarioDate: '15-20 May' },
                'WP', 'Table L2', [5, 5, 5, 5]
            );
            expect(errors).toEqual([]);
        });
    });
});

// ===========================================================================
//  SUITE 3: ResultSchema builder functions
// ===========================================================================

describe('ResultSchema builder functions', () => {

    test('createFlight() sets defaults for missing fields', () => {
        const flight = ResultSchema.createFlight({
            aircraftType: 'F-16',
            nationality: 'US',
        });

        expect(flight.aircraftType).toBe('F-16');
        expect(flight.nationality).toBe('US');
        expect(flight.aircraftId).toBeNull();
        expect(flight.actualNationality).toBeNull();
        expect(flight.tasking).toBe('');
        expect(flight.flightSize).toBe(0);
        expect(flight.flightCount).toBe(1);
        expect(flight.ordnance).toBeNull();
        expect(flight.sourceTable).toBeNull();
        expect(flight.text).toBe('');
    });

    test('createResult() wraps single flight in array', () => {
        const result = ResultSchema.createResult(
            { table: 'A', faction: 'NATO', text: 'test' },
            { aircraftType: 'F-15C', nationality: 'US', tasking: 'CAP', flightSize: 4 }
        );

        expect(result.table).toBe('A');
        expect(result.faction).toBe('NATO');
        expect(result.flights).toHaveLength(1);
        expect(result.flights[0].aircraftType).toBe('F-15C');
    });

    test('createResult() accepts array of flights', () => {
        const result = ResultSchema.createResult(
            { table: 'C', faction: 'NATO' },
            [
                { aircraftType: 'F-15C', nationality: 'US', tasking: 'CAP', flightSize: 4 },
                { aircraftType: 'F-4G', nationality: 'US', tasking: 'SEAD', flightSize: 2 },
            ]
        );

        expect(result.flights).toHaveLength(2);
        expect(result.flights[0].tasking).toBe('CAP');
        expect(result.flights[1].tasking).toBe('SEAD');
    });

    test('validate() returns empty array for valid result', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        const result = ResultSchema.createResult(
            { table: 'A', faction: 'NATO', text: 'test' },
            { aircraftType: 'F-15C', nationality: 'US', tasking: 'CAP', flightSize: 4, flightCount: 1 }
        );

        const errors = ResultSchema.validate(result, 'test');
        expect(errors).toEqual([]);

        warnSpy.mockRestore();
    });

    test('validate() catches missing fields', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        const result = {
            table: '',
            faction: 'INVALID',
            flights: [
                { aircraftType: '', nationality: '', tasking: '', flightSize: 0, flightCount: 0 },
            ],
        };

        const errors = ResultSchema.validate(result, 'test');
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.includes('table'))).toBe(true);
        expect(errors.some(e => e.includes('faction'))).toBe(true);

        warnSpy.mockRestore();
    });

    test('validate() catches empty flights array', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        const result = { table: 'A', faction: 'NATO', flights: [] };
        const errors = ResultSchema.validate(result, 'test');
        expect(errors.some(e => e.includes('non-empty'))).toBe(true);

        warnSpy.mockRestore();
    });
});

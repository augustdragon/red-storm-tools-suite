/**
 * NATOTableD3 - Baltic Approaches NATO Naval Strike Raid Processor
 * 
 * Table D3: NATO Naval Strike Raid (Baltic Approaches)
 * 
 * Structure:
 * - Static raid compositions based on date and nationality
 * - Date determines available nationalities (15-31 May vs 1-15 June)
 * - Single nationality roll determines complete raid package
 * - No individual aircraft or tasking rolls - predefined flight packages
 * 
 * Flight Generation:
 * - Roll once for nationality based on date
 * - Output complete predefined raid package for that nationality
 * - Each nationality has fixed flight types, sizes, and aircraft
 */

class NATOTableD3 extends BaseTableProcessor {
  constructor(tableData) {
    super('D3', tableData);
  }

  /**
   * Process NATO Table D3 - Naval Strike Raid
   * 
   * @param {object} params - Processing parameters
   * @param {number|string} params.scenarioDate - Ordinal date (1, 2, 3) or date range string
   * @returns {object} Result object with complete raid package
   */
  process(params) {
    let { scenarioDate } = params;
    
    if (!scenarioDate) {
      return { 
        text: 'Error: Scenario date is required for Table D3',
        error: 'Missing scenario date parameter'
      };
    }

    // If scenarioDate is numeric (ordinal), convert using COMBINED_MAY mapping
    // D3 combines both May periods into '15-31 May'
    if (typeof scenarioDate === 'number' && window.BA_DATE_RANGES_COMBINED_MAY) {
      scenarioDate = window.BA_DATE_RANGES_COMBINED_MAY[scenarioDate];
    }

    // Get nationality rolls for the specified date range
    const nationalityRolls = this.tableData.nationalityRolls[scenarioDate];
    if (!nationalityRolls) {
      return {
        text: `Error: No D3 data found for date "${scenarioDate}"`,
        error: `No D3 data found for date "${scenarioDate}"`
      };
    }

    // Roll for nationality
    const nationalityResult = this.rollForNationality(nationalityRolls, `D3 Nationality (${scenarioDate})`);
    if (nationalityResult.error) {
      return {
        text: `Error: ${nationalityResult.error}`,
        error: nationalityResult.error,
        debugRolls: []
      };
    }

    // Generate complete raid package
    const raidPackage = this.generateRaidPackage(nationalityResult.nationalityData);
    
    return {
      text: raidPackage.text,
      nationality: nationalityResult.nationality,
      scenarioDate: scenarioDate,
      raidType: 'Naval Strike',
      flights: raidPackage.flights,
      debugRolls: [nationalityResult.nationalityRollDebug]
    };
  }

  /**
   * Roll for nationality based on date range
   * 
   * @param {object} nationalityRolls - Nationality roll ranges for the date
   * @param {string} rollLabel - Label for debug output
   * @returns {object} Nationality selection result
   */
  rollForNationality(nationalityRolls, rollLabel = 'Nationality') {
    const nationalityRollResult = makeDebugRoll(10, rollLabel);
    const roll = nationalityRollResult.roll;
    
    // Find matching nationality based on roll ranges
    for (const [range, nationalityData] of Object.entries(nationalityRolls)) {
      const [min, max] = parseRange(range);
      if (roll >= min && roll <= max) {
        return {
          nationalityRoll: roll,
          nationalityRollDebug: nationalityRollResult.debugEntry,
          nationality: nationalityData.nationality,
          nationalityData
        };
      }
    }
    
    return {
      nationalityRoll: roll,
      nationalityRollDebug: nationalityRollResult.debugEntry,
      nationality: null,
      nationalityData: null,
      error: `No nationality found for roll ${roll}`
    };
  }

  /**
   * Generate complete raid package for a nationality
   * 
   * @param {object} nationalityData - Nationality data with predefined flights
   * @returns {object} Complete raid package with text and flight data
   */
  generateRaidPackage(nationalityData) {
    const flights = [];
    const flightTexts = [];

    // Group flights by type, aircraft, flight size, and resolved nationality to avoid mixing overrides
    const groupedFlights = {};
    
    nationalityData.flights.forEach(flightDef => {
      const { type, flightSize, flightCount } = flightDef;
      const aircraftEntry = flightDef.aircraft;
      const aircraftName = (aircraftEntry && typeof aircraftEntry === 'object')
        ? aircraftEntry.name
        : aircraftEntry;
      const aircraftId = (aircraftEntry && typeof aircraftEntry === 'object')
        ? aircraftEntry.aircraftId
        : null;
      const raidNationality = nationalityData.nationality;
      const explicitNationality = flightDef.nationality;
      const useExplicitNationality = explicitNationality && !explicitNationality.includes('/');
      const extractedNationality = useExplicitNationality
        ? explicitNationality
        : this.extractNationalityCode(aircraftName, raidNationality);
      const resolvedNationality = extractedNationality || raidNationality || 'Unknown';
      
      console.log('[D3 GROUPING] Aircraft:', aircraftName, 'Raid nationality:', raidNationality, 'Resolved nationality:', resolvedNationality, 'Explicit:', explicitNationality);
      
      const key = `${type}|${aircraftName}|${flightSize}|${resolvedNationality}`;
      if (!groupedFlights[key]) {
        groupedFlights[key] = {
          type,
          aircraftType: aircraftName,
          aircraftId,
          flightSize,
          displayNationality: resolvedNationality,
          resolvedNationality,
          count: 0
        };
        console.log('[D3 GROUPING] Created new group for nationality:', groupedFlights[key].displayNationality);
      }
      
      groupedFlights[key].count += flightCount;
    });

    // Generate consolidated flight lines
    Object.values(groupedFlights).forEach(group => {
      const resolvedDisplay = group.resolvedNationality && group.resolvedNationality.includes('/')
        ? this.extractNationalityCode(group.aircraftType, group.resolvedNationality)
        : group.resolvedNationality;
      const flightNationalityText = resolvedDisplay || group.displayNationality || group.resolvedNationality;
      const flightText = `${group.count} x {${group.flightSize}} ${flightNationalityText} ${group.aircraftType}, ${group.type}`;
      flightTexts.push(flightText);
      
      // Create flight object for printing
      const flightObj = {
        text: flightText,
        result: flightText,
        table: 'D3',
        faction: 'NATO',
        tasking: group.type,
        nationality: flightNationalityText,
        actualNationality: group.resolvedNationality,
        aircraftType: group.aircraftType,
        aircraftId: group.aircraftId,
        flightSize: group.flightSize,
        flightCount: group.count
      };
      console.log('[D3 PROCESSOR] Creating flight object:', flightObj);
      console.log('[D3 PROCESSOR] Flight nationality:', flightObj.nationality, 'actual nationality:', flightObj.actualNationality, 'for aircraft:', flightObj.aircraftType);
      flights.push(flightObj);
    });

    return {
      text: flightTexts.join('<br>'),
      flights: flights
    };
  }

  /**
   * Extract nationality code from aircraft string using database lookup
   * 
   * @param {string} aircraft - Aircraft name (may include nationality in parentheses)
   * @param {string} nationalityName - Nationality name from raid data
   * @returns {string} Nationality code for display
   */
  extractNationalityCode(aircraft, nationalityName) {
    console.log('D3 NATIONALITY DEBUG:', {
      aircraft,
      nationalityName,
      aircraftDBAvailable: !!window.aircraftNATO,
      aircraftDBKeys: window.aircraftNATO ? Object.keys(window.aircraftNATO).length : 0
    });
    
    if (nationalityName === 'FRG/DK') {
      const upperAircraft = aircraft ? aircraft.toUpperCase() : '';
      const danishPatterns = ['F-16A', 'F-35XD', 'RF-35XD'];
      const germanPatterns = ['BR.1150', 'TORNADO IDS', 'F-4F'];
      if (danishPatterns.some(pattern => upperAircraft.includes(pattern))) {
        console.log('D3: FRG/DK override nationality detected (Danish pattern):', upperAircraft);
        return 'DK';
      }
      if (germanPatterns.some(pattern => upperAircraft.includes(pattern))) {
        console.log('D3: FRG/DK override nationality detected (German pattern):', upperAircraft);
        return 'FRG';
      }
      const overrideNation = this.getFrgDkNationality(aircraft);
      if (overrideNation) {
        console.log('D3: FRG/DK override nationality found via helper:', overrideNation,
          'for aircraft:', aircraft);
        return overrideNation;
      }
    }

    // Try to resolve nationality directly from the aircraft database
    const dbNation = this.getAircraftNationalityFromDB(aircraft);
    if (dbNation) {
      console.log('D3: Aircraft nation resolved from database:', dbNation);
      return dbNation;
    }

    // Check if aircraft has nationality code in parentheses like "F-16A (DK)"
    const nationalityMatch = aircraft.match(/\(([A-Z]{2,4})\)$/);
    if (nationalityMatch) {
      const code = nationalityMatch[1];
      // Only use if it's a valid nationality code, not a variant like "(Navy)"
      if (['DK', 'FRG', 'UK', 'US', 'SE', 'POL', 'GDR', 'USSR'].includes(code)) {
        console.log('D3: Found explicit nationality in parentheses:', code);
        return code;
      }
    }
    
    // For multi-national raids, use known aircraft-to-nation mappings
    if (nationalityName === 'FRG/DK') {
      console.log('D3: No FRG/DK override found; defaulting to FRG for aircraft:', aircraft);
      return 'FRG';
    }
    
    // For single-nation raids, map nationality names to codes
    const nationalityMap = {
      'UK': 'UK',
      'UK(RAF)': 'UK',
      'UK(RN)': 'UK',
      'USAF': 'US',
      'USN': 'US',
      'USMC': 'US'
    };
    
    const result = nationalityMap[nationalityName] || nationalityName;
    console.log('D3: Single-nation mapping:', nationalityName, '->', result);
    return result;
  }

  /**
   * Determine FRG/DK nationality overrides for specific aircraft
   * @param {string} aircraft
   * @returns {string|null}
   */
  getFrgDkNationality(aircraft) {
    if (!aircraft) return null;
    const overrides = {
      'F-16A (DK)': 'DK',
      'BR.1150 ATLANTIC 2': 'FRG',
      'TORNADO IDS (NAVY)': 'FRG',
      'F-35XD DRAKEN': 'DK',
      'RF-35XD DRAKEN': 'DK',
      'F-4F': 'FRG'
    };
    const normalized = this.normalizeAircraftKey(aircraft).toUpperCase();
    console.log('[D3 OVERRIDE] normalize key:', normalized);
    if (overrides[normalized]) {
      console.log('[D3 OVERRIDE] override hit for', normalized, '->', overrides[normalized]);
      return overrides[normalized];
    }
    console.log('[D3 OVERRIDE] no override for', normalized);
    return null;
  }

  /**
   * Normalize aircraft key for database lookup
   * @param {string} aircraft
   * @returns {string}
   */
  normalizeAircraftKey(aircraft) {
    if (!aircraft) return '';
    return aircraft
      .replace(/<[^>]+>/g, '')
      .trim()
      .replace(/\s{2,}/g, ' ');
  }

  /**
   * Try to deduce nationality from aircraft data file
   * @param {string} aircraft
   * @returns {string|null}
   */
  getAircraftNationalityFromDB(aircraft) {
    const aircraftDB = window.aircraftNATO || {};
    if (!aircraft) return null;
    const baseKey = this.normalizeAircraftKey(aircraft);
    const variations = new Set();
    variations.add(baseKey);
    variations.add(baseKey.replace(/\s*\([^)]*\)$/, '').trim());
    variations.add(baseKey.replace(/\./g, '-'));
    variations.add(baseKey.replace(/\./g, '-').replace(/\s*\([^)]*\)$/, '').trim());
    variations.add(baseKey.replace(/^[A-Z]{2,4}\s+/, ''));
    variations.add(baseKey.replace(/^[A-Z]{2,4}\s+/, '').replace(/\s*\([^)]*\)$/, '').trim());

    for (const key of variations) {
      if (!key) continue;
      const aircraftData = aircraftDB[key];
      if (aircraftData && aircraftData.nation) return aircraftData.nation;
    }

    return null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NATOTableD3;
}

console.log('NATOTableD3 processor loaded');
